# Aegis — Frontend Build Spec (v2)

> A real designer wrote this brief. The previous version was generic. If your output reads as a Tailwind-template-with-dark-mode, you have failed the brief — go back and re-read this document.

---

## The product

**Aegis** is an autonomous Site Reliability Engineer. When production breaks at 3 AM, Aegis takes the page: it diagnoses across telemetry, proposes a fix, waits for approval, executes, writes the post-mortem. This frontend is the *incident war-room* — the screen on the wall while engineers sleep.

The audience is platform/SRE leads. They look at observability dashboards 9 hours a day. They have **taste**. They will close anything that looks like a hackathon project.

---

## Aesthetic direction (locked, non-negotiable)

**Late-shift editorial / mission-control broadsheet.**

Think *Financial Times print edition* crossed with a *NORAD situation display*. Calm, grave, dense, opinionated. Not "dark mode SaaS." Not "Linear clone." Not "Vercel observability skin." Closer to a printed broadsheet you'd find folded on an engineer's desk at 04:00.

If you're tempted to add a purple gradient, a glassmorphic blur, or a centered hero with a CTA — STOP. Wrong product.

### Mood references (do not copy, internalize)
- The texture of a Bloomberg Terminal at midnight
- The typographic hierarchy of FT.com weekend edition
- The signal-and-silence of a Tom Sachs spaceship interior
- The gravity of a NYC Subway operations control center
- The intentional roughness of Berkeley Mono in technical docs

---

## Typography (locked — do NOT substitute)

| Role | Family | Source | Settings |
|------|--------|--------|----------|
| Display & editorial | **Fraunces** | Google Fonts (variable) | `opsz: 144; SOFT: 60; WONK: 1` for hero numbers; `opsz: 24` for section headers. Use the wonky/soft axes — that's the warmth. |
| UI body & nav | **Onest** | Google Fonts | weights 400/500/600 only. Default `letter-spacing: -0.005em`. |
| Mono / data / IDs / timestamps | **JetBrains Mono** | Google Fonts | `font-feature-settings: 'calt' 1, 'liga' 1, 'zero' 1, 'tnum' 1`. Use the slashed zero. |
| Small-caps accent | Fraunces | — | `font-variant-caps: all-small-caps; letter-spacing: 0.08em` for section labels like "PROPOSED REMEDIATION" |

**Forbidden:** Inter, Manrope, Space Grotesk, DM Sans, Outfit, Geist Sans, Roboto, Arial, any system stack as the primary face. Using these is an automatic Originality penalty.

Display sizes:
- Hero number (MTTR counter): Fraunces `clamp(4rem, 2rem + 8vw, 9rem)`, weight 400, opsz 144, line-height 0.9, letter-spacing -0.04em.
- Incident title: Fraunces `clamp(2rem, 1rem + 3vw, 3.5rem)`, weight 400, italic, opsz 96, line-height 1.05, letter-spacing -0.02em.
- Section eyebrow: Fraunces small-caps, 11px, tracking 0.12em, color `--text-muted`.

---

## Color (locked)

Not gray + amber. **Cold ink + persimmon ember.**

```css
:root {
  /* Canvas — not black. Cold ink with a faint blue undertone. Night shift. */
  --ink-canvas:   oklch(13% 0.008 250);
  --ink-surface:  oklch(17% 0.010 250);
  --ink-elevated: oklch(22% 0.012 250);
  --ink-overlay:  oklch(8%  0.005 250);

  /* Hairlines — the signature element. Top-edge gradients on every surface. */
  --hairline-bright: oklch(100% 0 0 / 0.08);
  --hairline-mid:    oklch(100% 0 0 / 0.05);
  --hairline-soft:   oklch(100% 0 0 / 0.025);

  /* Text — bone, oyster, slate. Not "white-on-black". */
  --bone:    oklch(96% 0.006 80);   /* primary text */
  --oyster:  oklch(78% 0.008 80);   /* secondary */
  --slate:   oklch(54% 0.010 250);  /* muted */
  --grave:   oklch(38% 0.012 250);  /* dim, used for resolved/past */

  /* Persimmon ember — the ONLY chromatic accent. Used semantically. */
  --ember-300: oklch(78% 0.16 38);
  --ember-400: oklch(70% 0.20 35);  /* primary accent */
  --ember-500: oklch(62% 0.21 32);
  --ember-glow: oklch(70% 0.20 35 / 0.32);

  /* Ice cyan — counter-accent. Used ONLY for resolved/verified states. */
  --ice-400: oklch(82% 0.13 200);
  --ice-glow: oklch(82% 0.13 200 / 0.28);

  /* Severity scale — distinct chromatic identities, no spectrum-rainbow */
  --sev-p0: oklch(58% 0.24 22);   /* deep crimson */
  --sev-p1: var(--ember-400);     /* persimmon */
  --sev-p2: oklch(75% 0.10 80);   /* muted gold */
  --sev-p3: oklch(65% 0.04 250);  /* ice gray */

  --status-resolved: var(--ice-400);
  --status-investigating: var(--ember-400);
}
```

**Anti-rules:**
- Ember/persimmon may NEVER appear as decoration. Only on: active severity badge, anomaly band on charts, primary action button, the "live" pulse strip, agent status indicator while thinking.
- Ice cyan ONLY on resolved/verified states. Nowhere else.
- Cards do NOT get colored borders. Hairlines only.

---

## Signature visual elements (must implement all)

These tie the UI together. Without them it's a generic dark UI.

1. **The Hairline System**
   Every elevated surface gets a 1px top-edge highlight via pseudo-element:
   ```css
   .surface::before {
     content:""; position:absolute; inset: 0 0 auto 0; height:1px;
     background: linear-gradient(90deg,
       transparent 0%, var(--hairline-mid) 20%, var(--hairline-bright) 50%,
       var(--hairline-mid) 80%, transparent 100%);
   }
   ```
   Plus a 1px solid `--hairline-soft` bottom-edge for depth. The combination is the visual signature.

2. **Atmosphere — fixed-position SVG grain at 3% opacity**
   Inline SVG noise (no asset), `position: fixed; inset: 0; pointer-events: none; mix-blend-mode: overlay; opacity: 0.035`. Breaks the flatness of dark UI.

3. **The Persimmon Strip**
   When an incident is active, a 2px persimmon line sits at the very top of the viewport (`position: fixed; top: 0; left: 0; right: 0`). It slowly breathes: `opacity 1 → 0.55 → 1` over 2.8s `ease-in-out` infinite. When status flips to `resolved`, it transitions to ice cyan and stops breathing.

4. **The Ember Loader**
   While the agent is thinking, no spinner. Instead a 40×2px horizontal ember bar at the agent-step current row, scaleX-pulsing `0.3 → 1 → 0.7` over 1.4s `ease-in-out` infinite with `transform-origin: center`. Distinctive, calm, technical.

5. **Skewed severity chip**
   NOT a rounded pill. A `-6deg` skewed parallelogram with a cropped lower-right corner (`clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)`). The label inside is `transform: skewX(6deg)` to counter. Looks like a piece of broadcast-graphics chyron.

6. **Tabular timestamps with dimmed seconds**
   `14:23:11.247Z` where everything from the second `:` onward is `opacity: 0.5`. Mono font with tabular nums. Used everywhere a time appears.

7. **Editorial section eyebrows**
   Every major content block has a small-caps eyebrow + a 1px horizontal rule. Like a newspaper section header. Example: `PROPOSED REMEDIATION ───────`.

8. **Number animation on metrics**
   MTTR counter, latency p95, throughput — animate count-up on first render (0 → target in 1100ms `ease-out-quint`), and on update tween between values. Use Framer Motion's `useSpring` + `useTransform` so it's frame-perfect.

9. **The Hairline Grid (background)**
   On the body, a fixed-position 64×64px grid via `background-image: linear-gradient(...)` at `oklch(100% 0 0 / 0.018)`. Almost subliminal. Anchors the eye.

10. **Asymmetric ApprovalBar**
    Sticky footer is NOT centered. Left 70% = remediation card with full detail; right 30% = action stack. The split is 7:3 — broadsheet column ratio, not 50:50.

---

## Layout philosophy

**Density without chaos.** A 12-column grid violated where it should be.

`/incidents/demo` composition:
```
┌──────────────────────────────────────────────────────────────┐
│ ═════════════════ (2px ember strip — fixed, breathing) ═════ │
│                                                              │
│ AEGIS · OPS    DASHBOARD  INCIDENTS  RUNBOOKS    ⬤ y@email   │
│ ────────────────────────────────────────────────────────────  │
│ [self-metrics inline strip:                                   │
│   req/min 4,847  ·  p95 84ms  ·  err 0.02%  ·  ⬤ healthy]    │
│ ────────────────────────────────────────────────────────────  │
│                                                              │
│ ┃ INCIDENT · INC-2026-0042 · 14:23:11.247Z                   │
│ ┃                                                            │
│ ┃ Checkout latency spike on                                  │
│ ┃ shopping-cart-service                                      │
│ ┃                  ┌──┐                                      │
│ ┃ 04:47  ▲  P1     │R3│  detected by Dynatrace               │
│ ┃ MTTR     status   skewed chip                              │
│                                                              │
│ ┌────────────────────────┐ ┌──────────────────────────────┐ │
│ │ AGENT TIMELINE ────────│ │ TELEMETRY ────────────────── │ │
│ │ ◆ 14:23:11 classify    │ │  p95 latency       (ember    │ │
│ │ │  P1 — checkout path  │ │  ╱╲ ╱╲     anomaly band)     │ │
│ │ ◆ 14:23:12 gather      │ │ ───╱──╲───────────           │ │
│ │ │  dt.problems.get     │ │                              │ │
│ │ ◆ 14:23:14 correlate   │ │  error rate                  │ │
│ │ ┃  ░░ ember loader ░░  │ │  ───────╱╲────               │ │
│ │ ◇ propose              │ │                              │ │
│ │                        │ │  throughput                  │ │
│ │                        │ │  ──╲──────────────           │ │
│ └────────────────────────┘ └──────────────────────────────┘ │
│                                                              │
│ ┌─ PROPOSED REMEDIATION ─────────────────┐ ┌── ACTION ────┐ │
│ │ Rollback shopping-cart-service to       │ │  ▸ APPROVE  │ │
│ │ abc1234 (Maya Chen, 4m ago).            │ │  ▸ REJECT   │ │
│ │ Blast radius: single deployment,        │ │  ▸ Modify   │ │
│ │ no schema change. Est downtime: 0s.     │ │              │ │
│ └─────────────────────────────────────────┘ └──────────────┘ │
│                                                              │
│ AEGIS-OPS · INC-2026-0042 · GMT+0           dogfood ⬤ live   │
└──────────────────────────────────────────────────────────────┘
```

The 7:3 column ratio is editorial, not symmetric. The IncidentHeader uses a left bar (2px ember) — a *blockquote stripe* from print. The footer is the ticket reference, mono, 11px, color `--grave`.

---

## Motion choreography (smooth — durations + easings named)

### Custom easings (in `tokens.css`)
```css
--ease-out-expo:   cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-quint:  cubic-bezier(0.22, 1, 0.36, 1);
--ease-in-out-soft:cubic-bezier(0.65, 0, 0.35, 1);
--spring-firm:     spring(stiffness: 380, damping: 32);  /* via Framer Motion */
--spring-soft:     spring(stiffness: 220, damping: 28);
```

### Page-load timeline for `/incidents/demo`

Total choreography: **≈1.4 seconds, frame-perfect at 60fps.**

| t (ms) | Element | Animation | Duration | Easing |
|--------|---------|-----------|----------|--------|
| 0 | Persimmon strip | translateX -100% → 0 | 600 | ease-out-expo |
| 0 | Background grain | opacity 0 → 0.035 | 400 | ease-out |
| 80 | Nav + dogfood strip | opacity 0 → 1, translateY -8 → 0 | 320 | ease-out-quint |
| 160 | Eyebrow "INCIDENT · INC-…" | opacity 0 → 1, translateY 6 → 0 | 280 | ease-out |
| 220 | Incident title (Fraunces serif) | character-by-character mask reveal | 12ms stagger × 32 chars + 380 per char | ease-out-quint |
| 460 | MTTR + status row | opacity 0 → 1, translateY 8 → 0 | 320 | ease-out |
| 480 | MTTR number | count-up 0 → 04:47 (in s) | 1100 | ease-out-quint |
| 520 | Severity chip | scale 0.92 → 1.04 → 1 | 700 | spring-soft |
| 560 | Telemetry charts | stroke-dashoffset path draw | 1200 | ease-out-quint |
| 600 | AgentTimeline rail | scaleY 0 → 1 (origin top) | 800 | ease-out-expo |
| 700 | Each AgentStep | opacity 0 → 1, translateY 18 → 0, 80ms stagger | 320 per step | ease-out-quint |
| 1080 | Ember loader on current step | scaleX pulse begins (infinite) | 1400 cycle | ease-in-out-soft |
| 1100 | ApprovalBar (sticky footer) | translateY 100% → 0 | 480 | spring-firm |
| 1400 | Persimmon strip breathing | opacity 1 → 0.55 → 1 (infinite) | 2800 cycle | ease-in-out-soft |

### Interaction motions

| Event | Animation | Duration |
|-------|-----------|----------|
| Button press | scale 1 → 0.97 → 1 | 80ms down (ease-out), 240ms up (spring-firm) |
| AgentStep hover | background fade `--ink-surface` → `--ink-elevated` | 180ms ease-out |
| AgentStep expand | Framer Motion `layout` height auto + opacity 0 → 1 on content | 320ms ease-out-quint |
| Severity chip hover | box-shadow `0 12px 32px -10px var(--ember-glow)` → `0 18px 40px -8px var(--ember-glow)` | 240ms ease-out |
| Approve button hover | glow ramps ember-glow opacity 0.32 → 0.48, scale 1 → 1.018 | 220ms spring-soft |
| Approve button click | scale 0.96, glow flares to 0.62 for 220ms, then settles | 220ms |
| Reject button click | shake -2px → 2px → 0 (3 cycles) | 280ms ease-in-out |
| Chart hover scrub | crosshair line + value pill follows pointer | 0 (instant), value pill fades in 140ms |
| Tab focus ring | 2px outline `--ember-400` offset 3px, fades in opacity 0 → 1 | 120ms ease-out |

### Reduced motion alternative (`@media (prefers-reduced-motion: reduce)`)

- No translates, scales, character reveals, path draws, stripe breathing.
- Opacity-only fades, max 200ms each.
- Stagger reduced to 40ms.
- MTTR number snaps to final value, no count-up.
- Loader becomes a static dot.

---

## Realistic mock data (`src/lib/mock-incident.ts`)

Asymmetric values. Named real-sounding services and engineers. Millisecond-precision timestamps. **No round numbers.**

```ts
export const mockIncident: Incident = {
  id: "INC-2026-0042",
  title: "Checkout latency spike on shopping-cart-service",
  severity: "P1",
  status: "investigating",
  detectedAt: "2026-05-16T14:23:11.247Z",
  affectedServices: ["checkout-api", "cart-service", "payment-orchestrator"],
  affectedTraffic: 0.124,       // 12.4% of requests, not "12%"
  detectedBy: "Dynatrace · davis-anomaly",

  selfMetrics: {  // for the AegisObservesStrip
    rpm: 4847,
    p95Ms: 84,
    errRatePct: 0.02,
    status: "healthy",
  },

  metrics: {
    latencyP95Ms: [/* 60 datapoints with realistic spike at index 42 — values like 87, 91, 88, 92, 89, …, 247, 312, 408, 511, 587, …, 432, 218, 142 */],
    errorRatePct: [/* spike from 0.02 to 4.7% then partial recovery */],
    throughputRps: [/* drops from 124 to 71 during spike */],
  },

  agentEvents: [
    { seq: 1, step: "classify", ts: "14:23:11.247Z", duration_ms: 312,
      summary: "P1 — checkout path, 12.4% of traffic, 3 services affected" },
    { seq: 2, step: "gather", ts: "14:23:11.559Z", duration_ms: 1247,
      tool_call: { name: "dynatrace.problems.get", input: { window: "5m" },
        output: { problem_id: "PRB-7af3", entities: ["cart-service-7c9d"], severity: "AVAILABILITY" } } },
    { seq: 3, step: "gather", ts: "14:23:12.806Z", duration_ms: 1622,
      tool_call: { name: "dynatrace.traces.search", input: { service: "cart-service", limit: 200 },
        output: { count: 187, slow_pct: 41.2 } } },
    { seq: 4, step: "gather", ts: "14:23:14.428Z", duration_ms: 894,
      tool_call: { name: "dynatrace.deployments.list", input: { service: "cart-service", window: "1h" },
        output: { deployments: [{ id: "abc1234", author: "Maya Chen", at: "14:18:42Z", message: "feat(cart): inline session cache" }] } } },
    { seq: 5, step: "correlate", ts: "14:23:15.322Z", duration_ms: 1108,
      summary: "Latency rose 3.2× starting 14:18:51Z, 9s after Maya Chen's deploy abc1234 'feat(cart): inline session cache'" },
    { seq: 6, step: "hypothesize", ts: "14:23:16.430Z", duration_ms: 1947,
      payload: { hypotheses: [
        { id: "h1", text: "Unbounded session cache → memory pressure → GC pauses", confidence: 78,
          evidence: ["heap usage +180% post-deploy", "GC pause p95 47ms → 312ms"] },
        { id: "h2", text: "Downstream payment-svc slowdown", confidence: 31,
          evidence: ["payment-svc p95 nominal", "but dependency call count unchanged"] },
      ] } },
    { seq: 7, step: "verify", ts: "14:23:18.377Z", duration_ms: 1421,
      summary: "Confirmed h1. Heap on cart-service-7c9d sits at 87% (norm: 31%). GC pauses 6× normal.",
      confidence: 92 },
    { seq: 8, step: "propose", ts: "14:23:19.798Z", duration_ms: 0,
      payload: {
        action: "rollback",
        target: "shopping-cart-service",
        from_version: "abc1234",
        to_version: "abc1233",
        blast_radius: "Single deployment, no schema change, no downstream contract change",
        est_downtime_sec: 0,
        rollback_method: "kubectl rollout undo deployment/cart-service",
      } },
  ],

  proposedRemediation: {
    action: "rollback",
    target: "shopping-cart-service",
    summary: "Rollback to abc1233 (Maya Chen, 4m ago)",
    blastRadius: "Single deployment, no schema change. Est downtime: 0s.",
    estDowntimeSec: 0,
  },
};
```

---

## Routes & required surfaces

### `/`
HTTP 307 redirect to `/incidents/demo`. No content of its own.

### `/_style`
Living style guide. Renders ALL of:
- Color swatches (each with token name + oklch value + hex fallback)
- Typography stack (display in 4 sizes, body in 4 sizes, mono in 3 sizes, small-caps eyebrow)
- Severity chips at all 4 severities (P0-P3)
- Status pills (open / investigating / proposing / awaiting / resolved)
- Button variants (primary "Approve", ghost "Reject", subtle "Modify")
- AgentStep states (pending / current-with-ember-loader / completed)
- HypothesisCard with confidence bar
- The hairline system demonstrated on 3 different sizes of card
- Motion easing demos — 6 boxes that slide in on click, each labeled with curve name
- The grain overlay toggle button (off / on at 1% / 3% / 5%)

The page is itself an example of the design language — generous gutters, serif section labels, mono captions for values.

### `/incidents/demo`
Reads `mockIncident`. Renders the war-room layout above. All animations choreographed per the timing table. Approve / Reject buttons are wired to local state — clicking Approve transitions status to `resolved`, swaps persimmon strip to ice cyan, fades the ember loader, slides a small "RESOLVED · 04:47 MTTR" pill in.

---

## Anti-cheese rules

- **No `font-family: Inter`** anywhere. Auto-fail Originality.
- **No `--primary` named `blue` or `purple`**. The only chromatic accent is ember (persimmon). Auto-fail.
- **No round mock numbers** (5000, 100, 50). Asymmetric only.
- **No `Lorem ipsum`**. Use the realistic data above.
- **No shadcn defaults visible**. Card must NOT have default rounded-lg + border. Button must NOT have default shadcn primary look.
- **No `text-align: center` for the main composition.** Editorial layouts are left-aligned (with one or two exceptions for status pills).
- **No emoji icons.** Use Lucide only, sparingly. Many sections have NO icon — that's intentional.
- **No `transition: all`**. Specify which property transitions.
- **No animating `width`, `height`, `top`, `left`, `margin`, `padding`.** Only `transform`, `opacity`, `scale`. Use Framer `layout` for layout shifts.
- **No `pnpm dev` left in broken state.** Evaluator depends on it running.

---

## Definition of done

Evaluator will fail any iteration that doesn't satisfy ALL of:

- [ ] Fonts loaded: Fraunces + Onest + JetBrains Mono. Visible in `document.fonts` and computed style.
- [ ] No Inter/Manrope/Geist/Roboto/Arial anywhere as a primary face.
- [ ] Persimmon strip exists at top of page, breathes when status = investigating.
- [ ] Grain overlay present at ≈3% opacity (mix-blend-mode overlay).
- [ ] Hairline system applied to every elevated surface (top-edge gradient).
- [ ] Skewed severity chip implemented (not rounded pill).
- [ ] Tabular numbers throughout; timestamps show dimmed seconds.
- [ ] MTTR animates count-up on first render.
- [ ] Choreographed page-load runs per timing table (Lighthouse measures don't catch this — evaluator does video frame check).
- [ ] AgentTimeline ember-loader scaleX-pulses on the current step.
- [ ] ApprovalBar uses 7:3 column ratio, not 50:50.
- [ ] All keyboard-accessible with visible ember focus rings.
- [ ] `prefers-reduced-motion` alternative present (verified by simulating in Playwright).
- [ ] Responsive 320/768/1440 with intentional layout adjustments (NOT just stacking columns).
- [ ] Lighthouse desktop perf ≥ 95, a11y ≥ 95 on `/incidents/demo`.
- [ ] Realistic mock data wired (no Lorem ipsum, no round numbers).

---

## Working dir, stack, commit conventions

| | |
|---|---|
| Working dir | `frontend/` |
| Framework | Next.js 15 App Router + Turbopack |
| Language | TypeScript 5 strict |
| Styling | Tailwind v4 `@theme` token bridge |
| Primitives | shadcn/ui — **fully re-themed**, defaults forbidden |
| Motion | **Framer Motion 11** with springs + LayoutGroup |
| Charts | Recharts 2 (heavily restyled) |
| Icons | Lucide (sparingly) |
| Fonts | `next/font/google`: Fraunces, Onest, JetBrains Mono |
| Pkg mgr | pnpm |
| Lint/format | Biome |

Commits: Conventional commits. Each iteration at least one commit.

Out of scope this loop: auth, backend integration, marketing landing, dashboard, settings, light theme.

---

## Why this matters

Hackathon judges scroll through 50 submissions. 47 of them use Inter on dark mode with a purple gradient. The 3 that don't are the ones that win. Your job is to be one of the 3.

If your output, screen-shot, would be indistinguishable from a Vercel template — restart.

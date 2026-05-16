# Aegis Frontend — Evaluation Rubric (v2)

> Used by `gan-evaluator` to score each iteration. Output goes to `feedback/feedback-{N}.md`.
> If the rubric and spec ever disagree, the spec wins.

---

## Scoring model

- 4 axes, each scored 0–10 (0.5 step OK).
- Weighted total: `Design × 0.30 + Originality × 0.20 + Craft × 0.25 + Functionality × 0.25`.
- **Pass:** weighted_total ≥ 7.0 **AND** every axis ≥ 5.0 (no-cheese: can't game the total by tanking one).

---

## Hard auto-fails

The following violations cap the relevant axis at **3.0 maximum** regardless of other quality:

| Violation | Caps |
|-----------|------|
| `Inter`, `Manrope`, `Space Grotesk`, `Geist Sans`, `DM Sans`, `Roboto`, or system stack as the primary UI font | Originality ≤ 3.0 |
| No persimmon strip at top of viewport | Design ≤ 4.0 |
| Severity badge is a rounded pill (not skewed parallelogram) | Originality ≤ 4.0 |
| `Lorem ipsum`, round mock numbers (5000, 100, etc.) | Functionality ≤ 4.0 |
| No grain overlay, OR grain over 6% opacity | Design ≤ 5.0 |
| Default shadcn Card / Button styling visible | Originality ≤ 4.0 |
| Persimmon used as decoration (not semantic) | Design ≤ 5.0 |
| Animating `width`/`height`/`top`/`left`/`margin` | Craft ≤ 5.0 |
| `pnpm dev` not reachable | Craft ≤ 1.0 AND Functionality ≤ 2.0 |
| Console errors at page load | Craft ≤ 5.0 |

---

## Axis 1 — Design (weight 30%)

Does the UI commit to the "late-shift editorial / mission-control broadsheet" direction per spec?

**Score 9–10:**
- Fraunces is visible and used for incident title (italic, soft/wonky axis settings) and the MTTR hero number.
- Persimmon ember accent used semantically only — present on severity, anomaly band, action button, status pulse.
- Ice cyan reserved for resolved states only.
- Hairline gradients on every elevated surface (top-edge highlight + bottom-edge shadow).
- Grain overlay present at ≈3% opacity.
- Section eyebrows use Fraunces small-caps tracked +0.12em with horizontal rule.
- 7:3 ApprovalBar column ratio.
- Tabular numbers everywhere; timestamps show dimmed sub-second portion.

**Score 7–8:**
- 4–5 signature elements implemented. 1–2 visible misses (e.g., timestamps lack dimmed seconds, or eyebrow lacks horizontal rule).
- Direction recognizable; doesn't read as a Vercel/Linear clone.

**Score 5–6:**
- Direction present but inconsistent. Hairlines missing on some surfaces. Persimmon used as decoration somewhere.

**Score 3–4:**
- Generic dark mode SaaS with the right colors but no signature details. Grain missing. No serif. No eyebrows.

**Score 0–2:**
- Looks like a default Tailwind starter with the canvas darkened.

**Evidence the evaluator MUST cite:**
- `document.fonts` computed family for `h1`, body, and `[data-num]`.
- Screenshot of severity chip with shape called out.
- Computed `background` on body — does it include the grain SVG?
- Computed `:before` on the first elevated `.card` — does it contain the hairline gradient?

---

## Axis 2 — Originality (weight 20%)

Does this look like 1-in-50 hackathon submissions or 47-in-50?

**Score 9–10:**
- A designer in side-by-side screenshots would NOT identify this as shadcn/Tailwind output.
- Distinctive font pairing (Fraunces + Onest + JetBrains Mono) instead of the AI-default trio.
- Ember loader is custom (horizontal pulse bar), not a spinner.
- Severity chips use skewed parallelogram + counter-skewed label.
- At least one signature element beyond the spec (e.g., custom focus ring shape, custom scrollbar, distinctive empty state).

**Score 7–8:**
- Customization clearly present. shadcn defaults not visible in the dominant surfaces.

**Score 5–6:**
- Customized in places but Card / Button / Badge still feel like shadcn defaults somewhere.

**Score 3–4:**
- Stock components with color tweaks only.

**Score 0–2:**
- Default shadcn.

**Evidence:**
- Comparison of rendered Button vs default shadcn Button styling (computed values).
- Screenshot proof of skewed severity chip with shape annotation.
- List of typography families found in `document.fonts`.

---

## Axis 3 — Craft (weight 25%)

Performance, accessibility, responsiveness, code hygiene, motion fidelity.

**Score 9–10:**
- Lighthouse desktop perf ≥ 95 AND a11y ≥ 95 on `/incidents/demo`.
- Full keyboard nav with visible ember focus rings (2px outline, 3px offset).
- `prefers-reduced-motion` alternative verified.
- Responsive at 320 / 768 / 1024 / 1440 with intentional layout (not just stacking).
- No console errors, no React hydration warnings.
- DevTools Performance shows ≥58fps during page-load choreography.

**Score 7–8:**
- Most boxes checked. 1–2 minor a11y warnings, or Lighthouse 90–94.

**Score 5–6:**
- Lighthouse below 90. Keyboard nav broken on a component. Some responsive jank.

**Score 3–4:**
- Multiple failures: console errors, missing focus rings, overflow at 320px.

**Score 0–2:**
- Doesn't run, or critical a11y / perf failures.

**Required process (the evaluator MUST perform):**
1. Verify `pnpm dev` reachable at `localhost:3000`. Else score Craft = 0 immediately.
2. `npx lighthouse http://localhost:3000/incidents/demo --only-categories=performance,accessibility --output=json --output-path=gan-harness/screenshots/lighthouse-{N}.json --quiet --chrome-flags="--headless"` — parse `categories.performance.score` and `categories.accessibility.score`.
3. Take Playwright screenshots at viewports 320, 768, 1440 of `/`, `/_style`, `/incidents/demo` → save to `gan-harness/screenshots/iter-{N}-{route}-{w}.png`.
4. Capture browser console for errors via Playwright.
5. Test keyboard nav: tab through `/incidents/demo`, verify visible focus, count interactive elements without focus rings.
6. Simulate `prefers-reduced-motion: reduce` via Playwright `emulateMedia`, screenshot, confirm motion alternative present.

---

## Axis 4 — Functionality (weight 25%)

Does the app match the spec's required surfaces and behaviors?

**Score 9–10:**
- `/` redirects to `/incidents/demo` (HTTP 307 or client redirect).
- `/_style` renders ALL required sections: colors, type, severity chips at 4 levels, status pills, button variants, agent step states, hypothesis card, hairline demos, motion demos, grain toggle.
- `/incidents/demo` renders: persimmon strip, AppNav with self-metrics strip, IncidentHeader with serif italic title + MTTR + skewed severity chip, AgentTimeline with ≥7 events from mock data (with at least one in current state showing ember loader, at least one expanded), TelemetryPanel with 3 charts and visible anomaly band, ApprovalBar 7:3 split.
- Clicking Approve flips state to resolved: strip → ice cyan, loader stops, "RESOLVED · 04:47 MTTR" pill slides in.
- All mock data is realistic (asymmetric numbers, named services, real-looking commit hashes).

**Score 7–8:**
- Most required components present. 1 minor element missing (e.g., approval click handler stubbed).

**Score 5–6:**
- Half the required components, or `/_style` is sparse.

**Score 3–4:**
- Routes render but mostly empty / scaffolding only.

**Score 0–2:**
- Routes 404 or page is empty.

---

## Feedback file format

Each evaluator iteration writes `gan-harness/feedback/feedback-{N}.md`:

```markdown
# Feedback — Iteration {N}

**Run timestamp:** {ISO}
**Dev server URL:** http://localhost:3000
**Lighthouse:** perf={X} a11y={Y}

## Axis scores

| Axis | Score | Weight | Weighted |
|------|-------|--------|----------|
| Design | X.X | 30% | X.XX |
| Originality | X.X | 20% | X.XX |
| Craft | X.X | 25% | X.XX |
| Functionality | X.X | 25% | X.XX |
| **Total** | | | **X.XX** |

**Pass:** {YES if total≥7.0 AND min_axis≥5.0 else NO}
**Min axis:** {axis} ({score})
**Hard-fail caps triggered:** {list or "none"}

## Evidence

### Design (X.X)
- Fonts found via document.fonts: {list}
- Persimmon strip present: {yes/no, screenshot}
- Hairline system on cards: {yes/no, computed :before output}
- Grain overlay: {yes/no, opacity, mix-blend-mode}
- Severity chip shape: {description, screenshot}
- Timestamps dimmed sub-second: {yes/no, example}
- Section eyebrows + hr: {yes/no, count}

### Originality (X.X)
- shadcn defaults visible: {yes/no, which components}
- Custom ember loader: {yes/no}
- Skewed severity chip: {yes/no}
- Signature details beyond spec: {list}

### Craft (X.X)
- Lighthouse perf: {N}
- Lighthouse a11y: {N}
- Console errors: {count + samples}
- Keyboard nav pass: {yes/no, problems}
- prefers-reduced-motion alternative: {yes/no}
- Responsive 320/768/1024/1440: {pass/fail per breakpoint}

### Functionality (X.X)
- `/` redirect: {yes/no}
- `/_style` sections: {checklist}
- `/incidents/demo` components: {checklist}
- Mock data realism: {pass/fail per check}
- Approve interaction: {works/doesn't}

## Screenshots
- screenshots/iter-{N}-incidents-1440.png
- screenshots/iter-{N}-incidents-768.png
- screenshots/iter-{N}-incidents-320.png
- screenshots/iter-{N}-style-1440.png
- screenshots/lighthouse-{N}.json

## Top improvements for next iteration (max 5, ranked by score impact)

1. {Most impactful concrete change with specific file/line if possible}
2. ...

## Anti-cheese audit

- [ ] No modifications to `.claude/plan/*`, `gan-harness/*`, or `backend/*`
- [ ] All dependencies match the pinned stack
- [ ] Tokens file is single source of truth (no hardcoded oklch/hex outside tokens.css)
- [ ] No `transition: all`
- [ ] No animating layout properties (width/height/top/left)
- [ ] Conventional commit landed for this iteration

Violations: {list or "none"}
```

---

## Evaluator process (run this in order)

1. **Pre-flight:** Verify `frontend/` exists, `pnpm dev` reachable at `localhost:3000` with 200 OK on `/incidents/demo`. If not, write a minimal feedback file scoring Craft=0, Functionality=0 with "Generator did not leave dev server running" and return.

2. **Install Playwright** if not present: `npx playwright install --with-deps chromium` (idempotent).

3. **Lighthouse run** at desktop preset → save JSON to screenshots/.

4. **Playwright sweep:**
   - For each (route, viewport) in `[('/', 1440), ('/_style', 1440), ('/incidents/demo', 1440), ('/incidents/demo', 768), ('/incidents/demo', 320)]`: navigate, wait for `domcontentloaded`, screenshot.
   - On `/incidents/demo` desktop: capture computed styles for `body`, `h1.incident-title`, `.severity-chip`, first `.card::before`.
   - Capture `document.fonts.size` and iterate to list family names.
   - Capture console logs / errors during page load.
   - Test `Tab` through page, count focusable elements without `outline` or focus style.
   - Toggle `prefers-reduced-motion: reduce` via `emulateMedia`, re-screenshot.
   - Click Approve, screenshot post-click state.

5. **Score** each axis with cited evidence.

6. **Write feedback** file.

7. **Do NOT** touch `frontend/` source code — only `gan-harness/feedback/` and `gan-harness/screenshots/`.

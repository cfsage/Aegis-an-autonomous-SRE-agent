# Implementation Plan: Aegis — Autonomous SRE Agent

> **Hackathon:** Google Agent Hackathon — *Building Agents for Real-World Challenges*
> **Partner Track:** Dynatrace ($5,000 1st place — small competition pool)
> **Stack:** Gemini 3 Pro + Google Cloud Agent Builder + Dynatrace MCP
> **Goal:** Win 1st place + portfolio piece + path to SaaS monetization

---

## 1. Why this project wins

### Strategic positioning
- **Smallest competition pool** of the 6 partner tracks. APM is specialized — most hackathon builders default to MongoDB/Elastic. The Dynatrace bucket will likely have the fewest serious entries.
- **Demo-friendly in 3 minutes**: an incident → live AI reasoning → diagnosis → remediation → resolution arc is visually dramatic. Judges remember stories, not features.
- **All 4 judging criteria hit hard**:
  1. *Technological Implementation* — deep multi-tool integration (Agent Builder, Gemini 3, Dynatrace MCP, Firestore, Cloud Run).
  2. *Design* — opinionated dark-luxury SRE console with motion. Not a template.
  3. *Potential Impact* — every company has incidents; MTTR is a measurable, monetizable pain.
  4. *Quality of Idea* — "AI SRE that monitors itself via Dynatrace" is a unique meta-loop.

### Why it monetizes later
- Clear ICP: platform/SRE teams at 50–5000 person SaaS companies.
- Clear tiers: Free (1 connector / 100 incidents) → Team ($49/seat/mo) → Enterprise (SSO, on-prem, audit).
- Wedge: incident triage. Land. Expand into proactive reliability, runbook generation, change risk scoring.

---

## 2. Task Type

- [x] **Fullstack** (Frontend + Backend + Agent + Infra)
- [x] Multi-step agent (plan → execute → verify with human approval)
- [x] Deep partner MCP integration (Dynatrace is the agent's senses)

---

## 3. Product spec

### One-line pitch
**"Your AI Site Reliability Engineer. It takes the page so you don't have to."**

### Core user flow
1. Connect Dynatrace tenant (OAuth or API token).
2. Dynatrace problem event → webhook → Aegis opens an incident.
3. Aegis streams its reasoning live to the UI as it:
   - Pulls related traces, logs, metrics, problem context.
   - Correlates with recent deployments.
   - Forms hypotheses, verifies each by re-querying telemetry.
   - Identifies root cause + confidence score.
   - Proposes remediation (rollback, scale-up, feature flag toggle, runbook step).
4. Engineer approves (or auto-approves under policy).
5. Aegis applies action, verifies resolution, writes a polished post-incident RCA.

### Differentiating UX touches
- **Live "thinking" pane**: streamed token-by-token reasoning, tool calls visualized as cards.
- **Confidence telemetry**: every hypothesis has a 0–100 confidence and the evidence that supports it.
- **Audit ledger**: every tool call, every decision, every approval — exportable.
- **Severity-tuned UI**: P0 incidents shift the whole UI into a high-contrast war-room mode.
- **"Aegis observes Aegis"**: dogfooding banner showing live Dynatrace metrics of Aegis itself. Meta moment for the judges.

---

## 4. Technical Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (Next.js 15 App)                                        │
│  - Marketing landing (designed, not template)                    │
│  - Dashboard, Incident detail, Settings                          │
│  - SSE consumer for live agent thinking                          │
└──────────────────────────┬───────────────────────────────────────┘
                           │ HTTPS + SSE
┌──────────────────────────▼───────────────────────────────────────┐
│  FastAPI on Cloud Run                                            │
│  - /api/incidents (CRUD)                                         │
│  - /api/webhooks/dynatrace (alert ingest)                        │
│  - /api/stream/:id (SSE — live agent steps)                      │
│  - /api/approve (remediation approval)                           │
└────────┬────────────┬────────────────────────────┬───────────────┘
         │            │                            │
         ▼            ▼                            ▼
   ┌──────────┐ ┌─────────────┐         ┌──────────────────────┐
   │Firestore │ │Secret Mgr   │         │ Agent Builder runtime│
   │incidents │ │API keys     │         │ + Gemini 3 Pro       │
   │RCAs      │ │             │         │ + tools (below)      │
   └──────────┘ └─────────────┘         └──────┬───────────────┘
                                               │
                ┌──────────────────────────────┼──────────────────┐
                ▼                              ▼                  ▼
        ┌──────────────────┐         ┌─────────────────┐ ┌──────────────┐
        │ Dynatrace MCP    │         │ Internal tools  │ │ Notify tool  │
        │ (problems,traces,│         │ (rca_writer,    │ │ (Slack/Email)│
        │  logs,metrics,   │         │  hypothesis,    │ │              │
        │  deployments)    │         │  verify)        │ │              │
        └──────────────────┘         └─────────────────┘ └──────────────┘
```

### Agent reasoning loop (multi-step mission)
```
1. CLASSIFY    → severity, blast radius, affected services
2. GATHER      → call Dynatrace MCP: problems, traces, logs, deployments
3. CORRELATE   → align timeline of signals + recent changes
4. HYPOTHESIZE → enumerate 1–5 candidate root causes with confidence
5. VERIFY      → for top hypothesis, re-query telemetry to confirm/refute
6. PROPOSE     → remediation: rollback / scale / flag / manual runbook
7. AWAIT       → human approval (or policy-auto-approve)
8. EXECUTE     → apply via Dynatrace / Cloud APIs
9. VERIFY_FIX  → re-poll metrics, confirm resolution
10. RCA        → write post-incident report, store in Firestore
```

Each step emits a structured event to SSE so the UI animates the reasoning live.

### Tech stack

**Frontend**
- Next.js 15 (App Router) + TypeScript 5
- Tailwind CSS + shadcn/ui (heavily customized — no default look)
- Framer Motion for incident-state transitions
- TanStack Query for data, native EventSource for SSE
- Recharts for incident metrics
- Clerk for auth (fastest acceptable solution)

**Backend**
- Python 3.12 + FastAPI + Pydantic v2
- Google Cloud Agent Builder SDK
- Gemini 3 Pro (advanced reasoning required for RCA)
- Firestore (incidents, RCAs, audit log)
- Cloud Run (autoscaling, pay-per-request)
- Secret Manager (API keys)
- Cloud Build (CI/CD)

**Partner integration**
- Dynatrace MCP server (provided by Dynatrace) — primary data source
- Dynatrace OAuth for tenant connection
- Dynatrace API for remediation actions (where supported)

**Observability (the meta-loop)**
- Dynatrace OneAgent monitors Cloud Run service — Aegis watches Aegis

---

## 5. Implementation Steps (10-day plan)

> Assumes ~6 focused hours/day = ~60 hours total. Adjust to your runway.

### Day 0 — Pre-flight (2–4h)
- [ ] Create GCP project, enable: Agent Builder, Cloud Run, Firestore, Secret Manager, Cloud Build.
- [ ] Request $100 GCP credit via the form linked in `resources.md`.
- [ ] Create Dynatrace trial tenant; request MCP access from partner.
- [ ] Create public GitHub repo with **MIT LICENSE on initial commit** (judging requirement).
- [ ] Add a clean README skeleton + project board.

### Day 1 — Foundation (6h)
- [ ] `pnpm create next-app frontend` (TS, App Router, Tailwind).
- [ ] Install shadcn primitives we'll use, configure design tokens (oklch palette, typography scale, motion easings) per web rules.
- [ ] `frontend/` deployed to Vercel preview on first commit.
- [ ] `backend/` FastAPI skeleton + Dockerfile + Cloud Run deploy.
- [ ] Firestore collections seeded: `incidents`, `rca_reports`, `audit_log`, `tenants`.
- [ ] Clerk auth wired (Sign in with Google).

### Day 2 — Dynatrace MCP integration (6h)
- [ ] Implement `backend/app/mcp/dynatrace_client.py` wrapping the MCP server.
- [ ] Verify these calls work end-to-end against trial tenant:
  - List active problems
  - Fetch problem detail (events, affected entities)
  - Fetch logs for an entity in a time window
  - Fetch traces / spans
  - List recent deployments / change events
- [ ] Build `POST /api/webhooks/dynatrace` to receive alert payloads → create incident row.

### Day 3–4 — Agent core (12h)
- [ ] Provision Agent Builder agent backed by **Gemini 3 Pro**.
- [ ] Register tools: Dynatrace MCP (read), internal `write_rca`, `notify_slack`, `propose_remediation`.
- [ ] Write the SRE system prompt with explicit reasoning policy + safety rules (no auto-execute without policy or approval).
- [ ] Implement orchestrator (`backend/app/agent/orchestrator.py`) running the 10-step loop above.
- [ ] Each step emits a structured `AgentEvent` (Pydantic) and writes to `audit_log`.
- [ ] Unit test with 3 canned incident fixtures (latency spike, memory leak, dependency outage).

### Day 5 — Live streaming UX (6h)
- [ ] `GET /api/stream/:incidentId` SSE endpoint → emits agent events from a per-incident queue.
- [ ] Frontend `useAgentStream(id)` hook.
- [ ] `<AgentTimeline />` — animates each step entering, with icon, label, tool call summary, expandable detail.
- [ ] Token-by-token reveal for reasoning text.

### Day 6–7 — Frontend polish (12h)
- [ ] **Marketing landing page** — opinionated direction (suggest dark editorial with single accent color, large display type, scrollytelling of an incident timeline). Per `web/design-quality.md`, must look intentional, not template.
- [ ] **Dashboard** — live incident feed, MTTR widget, severity distribution donut, "Aegis observes Aegis" panel showing self-metrics.
- [ ] **Incident detail page** — split layout: left = agent timeline, right = telemetry charts, footer = approval bar.
- [ ] **Settings** — Dynatrace connection wizard, approval policies (auto-approve safe rollbacks under P2, etc.), Slack webhook.
- [ ] Accessibility pass: keyboard nav, prefers-reduced-motion, contrast.
- [ ] Mobile responsive (don't ship a broken-on-phone demo).

### Day 8 — Approval, safety, audit (6h)
- [ ] `<RemediationModal />` shows: proposed action, expected effect, blast radius, rollback plan.
- [ ] `POST /api/incidents/:id/approve` records approval + executes via Dynatrace API.
- [ ] Verification loop: poll affected SLO/metric for N minutes, confirm resolved.
- [ ] Generate RCA: structured post-incident doc auto-written by Gemini 3 (timeline, root cause, contributing factors, action items).

### Day 9 — Demo scenario + dogfood (6h)
- [ ] Deploy a tiny demo app (Node.js "checkout service") with toggleable failures: latency spike, OOM, downstream timeout.
- [ ] Wire it to Dynatrace OneAgent.
- [ ] Add an internal `/demo/break` panel (hidden in prod) to trigger each scenario for the video.
- [ ] Install Dynatrace OneAgent on Aegis itself → enable the meta dashboard.
- [ ] Rehearse the 3-minute demo flow live 5+ times. Record fallback.

### Day 10 — Docs, video, submit (6h)
- [ ] README: hero shot, value prop, architecture diagram, quickstart, demo GIF.
- [ ] `docs/ARCHITECTURE.md`, `docs/DEMO_SCRIPT.md`, `docs/MONETIZATION.md`.
- [ ] Confirm LICENSE is detected by GitHub and shown in About section.
- [ ] Record final 3-min demo (ScreenStudio or similar — tight pacing, voiceover, no jump cuts).
- [ ] Deploy production builds; verify hosted URL works for an anonymous judge.
- [ ] Devpost submission: track = Dynatrace, repo URL, hosted URL, video URL.

---

## 6. Key Files

| File | Operation | Purpose |
|------|-----------|---------|
| `frontend/src/app/(marketing)/page.tsx` | Create | Designed landing — anti-template |
| `frontend/src/app/(app)/dashboard/page.tsx` | Create | Live incident feed + MTTR widget |
| `frontend/src/app/(app)/incidents/[id]/page.tsx` | Create | Split view: agent timeline + telemetry + approval |
| `frontend/src/app/(app)/settings/page.tsx` | Create | Dynatrace connection + approval policies |
| `frontend/src/components/agent/AgentTimeline.tsx` | Create | Streamed reasoning visualization |
| `frontend/src/components/agent/ToolCallCard.tsx` | Create | Renders each MCP call with input/output |
| `frontend/src/components/incident/RemediationModal.tsx` | Create | Approval flow with blast-radius preview |
| `frontend/src/components/marketing/IncidentScrolly.tsx` | Create | Scrollytelling demo on landing |
| `frontend/src/hooks/useAgentStream.ts` | Create | SSE consumer for `/api/stream/:id` |
| `frontend/src/lib/api.ts` | Create | Typed backend client |
| `backend/app/main.py` | Create | FastAPI app entry |
| `backend/app/agent/orchestrator.py` | Create | 10-step plan→execute→verify loop |
| `backend/app/agent/prompts.py` | Create | SRE system prompt + few-shot examples |
| `backend/app/agent/tools.py` | Create | Tool schema definitions for Agent Builder |
| `backend/app/mcp/dynatrace_client.py` | Create | Dynatrace MCP wrapper |
| `backend/app/api/incidents.py` | Create | Incident CRUD |
| `backend/app/api/webhooks.py` | Create | Dynatrace alert receiver |
| `backend/app/api/stream.py` | Create | SSE endpoint for live reasoning |
| `backend/app/api/approve.py` | Create | Remediation approval handler |
| `backend/app/services/rca_service.py` | Create | Generates post-incident report |
| `backend/app/models/incident.py` | Create | Pydantic + Firestore schemas |
| `infrastructure/terraform/main.tf` | Create | GCP resource provisioning |
| `infrastructure/cloudbuild.yaml` | Create | CI/CD pipeline |
| `docs/ARCHITECTURE.md` | Create | Diagram + component breakdown |
| `docs/DEMO_SCRIPT.md` | Create | Word-by-word 3-min video script |
| `docs/MONETIZATION.md` | Create | SaaS GTM + pricing tiers |
| `README.md` | Create | Hero + value prop + quickstart |
| `LICENSE` | Create | MIT (judging requirement) |

---

## 7. Risks and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Dynatrace MCP access delayed by partner | Medium | High | Apply on Day 0. Build against mocked MCP responses meanwhile; swap when real access lands. |
| GCP $100 credit insufficient | Low | Medium | Stay on free tier (Cloud Run scale-to-zero, Firestore free quota). Submit credit request Day 0. |
| Gemini 3 hallucinates a wrong root cause | High | High | (a) Mandatory verification step re-queries telemetry to confirm hypothesis before proposing fix. (b) Human approval required for any write action. (c) Confidence scores surfaced to user. |
| Agent runs slow → bad demo | Medium | High | Pre-warm Cloud Run; cache MCP responses for demo incidents; stream tokens so user sees progress immediately. |
| Live demo fails during video recording | Medium | Critical | Pre-record a flawless run as fallback; use deterministic seeded incident; keep failover script ready. |
| Open-source license not detected → DQ | Low | Critical | Add MIT LICENSE in initial commit; verify GitHub About section shows it before submit. |
| 3-min video runs over | Medium | Medium | Write script word-for-word; rehearse with timer; cut anything that doesn't advance the story. |
| Design ends up template-looking | Medium | High | Follow `web/design-quality.md` checklist; design lead-time on Day 6–7; reference 3 specific inspirations (Linear, Vercel observability, Sentry). |
| Multiple competitors build similar SRE agent | Medium | Medium | Differentiate on: (a) dogfooded "Aegis observes Aegis" loop, (b) polished UI, (c) clear monetization story, (d) approval/safety story. |
| MCP server unstable in trial tier | Medium | Medium | Add retries with backoff, circuit breaker, graceful degradation; demo uses pre-warmed scenario. |

---

## 8. Judging-criterion mapping (the scorecard view)

| Criterion | How Aegis scores |
|-----------|------------------|
| **Technological Implementation** | Multi-tool agent on Gemini 3 + Agent Builder + Dynatrace MCP + Cloud Run + Firestore. Real multi-step loop with verification. Streaming reasoning. Dogfooded observability. |
| **Design** | Opinionated, non-template UI; war-room mode; scrollytelling landing; motion design; accessibility pass. Specific design direction documented. |
| **Potential Impact** | MTTR is a multibillion-dollar problem. Quantified demo claim ("Aegis reduced this incident from 47 min to 38 sec"). Clear ICP and TAM. |
| **Quality of Idea** | Meta-loop ("Aegis observes itself via Dynatrace") + safety-first approval flow + structured RCA generation are not the usual hackathon angles. |

---

## 9. Path to monetization (for the future-you portfolio play)

**Pricing model (post-hackathon)**
- **Free** — 1 Dynatrace connector, 100 incidents/month, community Slack.
- **Team — $49 / engineer / month** — unlimited incidents, Slack/PagerDuty integration, approval policies, audit log export.
- **Enterprise — talk to us** — SSO/SAML, on-prem option, custom MCP connectors (Datadog, NewRelic), SOC2 path.

**Go-to-market wedge**
- Land via the free tier targeted at platform-team leads.
- Distribution: Show HN with the demo video; Dynatrace partner co-marketing if hackathon win.
- Expansion: incident triage → change-risk scoring → automated runbook generation → proactive SLO management.

**Defensibility**
- Memory of an org's incident history (Firestore) becomes a moat — better recommendations over time.
- Approval policies encoded per-team become switching cost.

**Why it survives "ChatGPT could do this"**
- Tight loop on real telemetry via MCP (not pasted logs).
- Verification step is grounded in fresh data, not stale chat.
- Human-in-the-loop approval is a product surface, not a model feature.

---

## 10. Open decisions for you to make

1. **Design direction** — I recommend **dark editorial / Linear-meets-Vercel-observability** with a single warm accent color (amber for incidents). Open to swapping if you prefer light-luxury or neo-brutalist.
2. **Hosting** — Vercel for frontend, Cloud Run for backend (recommended). Alternative: all on Cloud Run via Next.js container.
3. **Auth** — Clerk (fastest) recommended. Alternative: Firebase Auth (1 less dependency, more GCP-native).
4. **Demo app to monitor** — A toy "checkout service" in Node.js, or use one of Dynatrace's reference demo apps if they provide one (faster).
5. **Solo vs. team** — Plan assumes solo. If you have a teammate, swap Day 6–7 design into a parallel track and finish in 7–8 days instead.

---

## 11. SESSION_ID (for /ccg:execute use)

- **CODEX_SESSION:** _(not generated — codex wrapper not installed locally)_
- **GEMINI_SESSION:** _(not generated — gemini wrapper not installed locally)_

> Plan was synthesized from a single-model analysis pass since the external multi-model wrappers (`~/.claude/bin/codeagent-wrapper`) are not present on this machine. If you install them later, re-run `/multi-plan` to get a true Codex+Gemini cross-validated version. The architectural decisions here are conservative and well-supported by current GCP + Dynatrace docs.

---

## 12. Immediate next 3 actions

1. **Day 0, hour 1** — Create GCP project, request $100 credit, request Dynatrace MCP access. These are async, start them now.
2. **Day 0, hour 2** — Create public GitHub repo, push MIT LICENSE + README skeleton, verify About section shows the license.
3. **Day 1, morning** — Stand up Next.js + FastAPI skeletons, get both deploying to Vercel + Cloud Run on every push. Don't write features until deploy works.

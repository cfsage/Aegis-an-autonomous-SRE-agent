# Implementation Plan: Aegis Backend Bootstrap

> Parent project: [aegis-sre-agent.md](./aegis-sre-agent.md)
> Companion: [aegis-frontend-bootstrap.md](./aegis-frontend-bootstrap.md)
> Scope: FastAPI on Cloud Run + Firestore + Google Cloud Agent Builder + Gemini 3 + Dynatrace MCP + webhook ingest + SSE stream + approval flow + CI/CD + tests + observability (dogfooded via Dynatrace).

---

## 1. Outcome

After this plan, the backend supports the full demo:

1. `POST /api/webhooks/dynatrace` — ingests an alert (signature-verified, idempotent) → creates an `Incident` in Firestore → spawns async agent run.
2. Agent runs the 10-step loop (`classify → gather → correlate → hypothesize → verify → propose → await → execute → verify_fix → rca`), emitting one structured event per step to `incidents/{id}/agent_events`.
3. `GET /api/stream/{incident_id}` — SSE endpoint that tails the `agent_events` subcollection and emits events in order, with replay-from-zero support so reloads work.
4. `POST /api/incidents/{id}/approve` — records human approval, executes remediation via Dynatrace API, then runs verification + RCA steps.
5. `GET /api/incidents` and `GET /api/incidents/{id}` — list + detail.
6. `GET /api/dogfood/metrics` — returns the self-metrics shown in the frontend's "Aegis observes Aegis" strip.
7. Deployed to Cloud Run via Cloud Build; secrets in Secret Manager; logs/traces in Cloud Logging + Dynatrace.
8. Test suite (unit + integration) green; ≥80% coverage per global testing rule.

The frontend's `mockIncident` shape (in `frontend/src/lib/mock-incident.ts`) is the wire contract — backend events match it 1:1.

---

## 2. Stack & Versions

| Layer | Choice | Why |
|---|---|---|
| Runtime | Python 3.12 | Type hints, performance, GCP-supported |
| Framework | FastAPI 0.115+ | Async-first, OpenAPI auto, Pydantic v2 |
| Models | Pydantic v2 | Strict typing, fast, matches Firestore docs |
| DB | Firestore (Native mode) | Real-time, GCP-native, free tier generous |
| LLM | **Gemini 3 Pro** | Required by hackathon; best reasoning |
| Agent runtime | Google Cloud **Agent Builder** | Required by hackathon |
| Partner | Dynatrace MCP server | Hackathon requirement |
| Hosting | Cloud Run | Scale-to-zero, async-friendly |
| CI/CD | Cloud Build | GCP-native, free tier |
| Container | Distroless Python 3.12 | Small attack surface |
| Tracing | OpenTelemetry + OTLP → Dynatrace | The dogfood loop |
| Logs | Cloud Logging (structured JSON) | Native, queryable |
| Tests | pytest + pytest-asyncio + respx | Async test support, HTTP mocking |
| Lint/format | ruff + ruff format | One tool, fast |
| Type-check | mypy --strict | Type safety, matches Pydantic v2 |
| Secrets | Secret Manager | Per-tenant Dynatrace tokens |
| Pkg mgr | uv | Fast, reproducible |

---

## 3. Architecture

```
                   ┌──────────────────────────┐
                   │  Dynatrace (Customer)    │
                   │  - Sends webhooks        │
                   │  - Hosts MCP server      │
                   │  - Receives traces (us!) │
                   └────────┬─────────┬───────┘
                            │webhook  │MCP read
                            ▼         │
┌──────────────────────────────────────────────────────────────────┐
│  Cloud Run: aegis-api (FastAPI, async)                           │
│                                                                  │
│  Routers                  Services                 Agent         │
│  ───────                  ────────                 ─────         │
│  POST /webhooks/dynatrace → WebhookService                       │
│  POST /incidents          → IncidentService                      │
│  GET  /incidents/{id}     → IncidentService                      │
│  GET  /stream/{id}        → StreamService (SSE)                  │
│  POST /incidents/{id}/    → ApprovalService ──┐                  │
│       approve                                  │                  │
│  GET  /dogfood/metrics    → DogfoodService    │                  │
│                                                ▼                  │
│                                    Orchestrator ───┬──→ Tools    │
│                                    (state machine) │              │
│                                                    ▼              │
│                                          Agent Builder + Gemini 3 │
│                                                                  │
│  Background:  asyncio.create_task(orchestrator.run(incident_id)) │
│  Emits events → Firestore: incidents/{id}/agent_events/{seq}     │
└────────┬───────────────────────────────────────────┬─────────────┘
         │                                           │
         ▼                                           ▼
   ┌──────────┐                          ┌────────────────────┐
   │Firestore │                          │ Secret Manager     │
   │tenants/  │                          │ per-tenant tokens  │
   │incidents/│                          │ Dynatrace, Slack   │
   │  └ events│                          └────────────────────┘
   │  └ tools │
   │rca_reports
   │audit_log │
   └──────────┘
```

### Request flow — incident lifecycle

```
1. Dynatrace fires problem event
2. POST /webhooks/dynatrace
   - Verify HMAC signature (per-tenant secret)
   - Idempotency check (alert.problemId in last 24h?)
   - Resolve tenant from URL path or header
   - Create Incident(state=open) in Firestore
   - asyncio.create_task(orchestrator.run(incident_id))
   - Return 202 {incident_id, stream_url}
3. Frontend opens GET /stream/{id} (SSE)
4. Orchestrator runs 10-step loop, writing events
5. After "propose" step → state=awaiting_approval, stream emits remediation card
6. User POSTs /incidents/{id}/approve → executes via Dynatrace API
7. Orchestrator resumes: verify_fix → rca → state=resolved
8. SSE closes with terminal event
```

---

## 4. File Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                       # FastAPI app, middleware, lifespan
│   ├── config.py                     # Settings via pydantic-settings
│   ├── deps.py                       # FastAPI dependencies (auth, tenant, db)
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── webhooks.py               # POST /webhooks/dynatrace
│   │   ├── incidents.py              # GET/POST /incidents
│   │   ├── stream.py                 # GET /stream/{id} (SSE)
│   │   ├── approve.py                # POST /incidents/{id}/approve
│   │   ├── dogfood.py                # GET /dogfood/metrics
│   │   └── health.py                 # GET /healthz, /readyz
│   │
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── orchestrator.py           # 10-step state machine
│   │   ├── state.py                  # IncidentState enum + transitions
│   │   ├── builder.py                # Agent Builder client setup
│   │   ├── prompts.py                # System prompt + few-shot examples
│   │   ├── tools.py                  # Tool schema definitions
│   │   ├── tool_handlers.py          # Tool call execution
│   │   ├── token_budget.py           # Cost guard per incident
│   │   └── events.py                 # AgentEvent emitter (writes to Firestore)
│   │
│   ├── mcp/
│   │   ├── __init__.py
│   │   ├── dynatrace_client.py       # Dynatrace MCP wrapper
│   │   ├── dynatrace_models.py       # Typed responses
│   │   └── cache.py                  # Per-incident response cache
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── incident_service.py       # CRUD + state transitions
│   │   ├── webhook_service.py        # Signature verify + idempotency
│   │   ├── stream_service.py         # Firestore listener → SSE bytes
│   │   ├── approval_service.py       # Apply remediation
│   │   ├── rca_service.py            # Generate post-incident report
│   │   ├── dogfood_service.py        # Self-metrics from Dynatrace
│   │   └── tenant_service.py         # Tenant resolution + token fetch
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── incident.py               # Pydantic models (mirror frontend)
│   │   ├── agent_event.py            # Streamed event shapes
│   │   ├── tenant.py
│   │   └── audit.py
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── firestore.py              # Async Firestore client
│   │   └── repositories/
│   │       ├── incident_repo.py
│   │       ├── event_repo.py
│   │       ├── tenant_repo.py
│   │       └── audit_repo.py
│   │
│   ├── infra/
│   │   ├── __init__.py
│   │   ├── secrets.py                # Secret Manager wrapper
│   │   ├── telemetry.py              # OpenTelemetry setup
│   │   └── logging.py                # Structured JSON logger
│   │
│   └── safety/
│       ├── __init__.py
│       ├── policy.py                 # Approval policy evaluation
│       └── guardrails.py             # Action allow/deny list
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py                   # Fixtures: fake firestore, mock MCP
│   ├── unit/
│   │   ├── test_state_machine.py
│   │   ├── test_idempotency.py
│   │   ├── test_signature_verify.py
│   │   ├── test_token_budget.py
│   │   └── test_policy.py
│   ├── integration/
│   │   ├── test_webhook_flow.py
│   │   ├── test_stream_endpoint.py
│   │   ├── test_approval_flow.py
│   │   └── test_orchestrator_loop.py
│   └── fixtures/
│       ├── dynatrace_problem.json
│       ├── dynatrace_traces.json
│       └── mock_gemini_responses.json
│
├── scripts/
│   ├── seed_demo_tenant.py
│   ├── fire_demo_incident.py         # POSTs a fake alert (for demo recording)
│   └── load_test.py
│
├── pyproject.toml
├── uv.lock
├── Dockerfile                        # Distroless Python 3.12
├── .dockerignore
├── cloudbuild.yaml                   # CI/CD pipeline
├── ruff.toml
├── mypy.ini
└── README.md
```

---

## 5. Data Model (Firestore)

### `tenants/{tenant_id}`
```json
{
  "id": "tenant_abc",
  "name": "Acme Corp",
  "dynatrace_env_url": "https://abc.live.dynatrace.com",
  "dynatrace_token_secret_id": "projects/.../secrets/dt-token-abc",
  "webhook_secret_id": "projects/.../secrets/wh-secret-abc",
  "approval_policy": { "auto_approve_below": "P3", "allowed_actions": ["rollback","scale"] },
  "created_at": "2026-05-16T..."
}
```

### `incidents/{incident_id}`
```json
{
  "id": "INC-2026-0042",
  "tenant_id": "tenant_abc",
  "title": "Checkout latency spike on shopping-cart-service",
  "severity": "P1",
  "state": "investigating",
  "detected_at": "...",
  "resolved_at": null,
  "affected_services": ["checkout-api","cart-service"],
  "dynatrace_problem_id": "abc-123",
  "alert_hash": "sha256(...)",
  "proposed_remediation": null,
  "approval": null,
  "rca_report_id": null
}
```

### `incidents/{incident_id}/agent_events/{seq}`
Append-only, ordered by integer `seq`. Wire-compatible with the frontend's `AgentEvent` shape.

```json
{
  "seq": 5,
  "step": "hypothesize",
  "ts": "...",
  "duration_ms": 1200,
  "summary": "Top candidate: memory leak in deploy abc123",
  "payload": { "hypotheses": [...] },
  "tool_call": null,
  "confidence": 78
}
```

### `incidents/{incident_id}/tool_calls/{call_id}`
Every Dynatrace MCP call (replayability + debug).

### `rca_reports/{report_id}`
Final structured RCA doc.

### `audit_log/{event_id}`
Per-action audit row for compliance: approvals, executions, who/what/when.

---

## 6. Agent Loop — explicit state machine

```
       ┌─────────────────────────────────────────────────────────┐
       │                                                         │
[open] ─┤                                                         │
       │ classify         (severity, services, blast radius)     │
       ▼                                                         │
[investigating]                                                  │
       │ gather (×N)      (problems, traces, logs, deploys)      │
       │ correlate        (timeline of signals + changes)        │
       │ hypothesize      (1–5 candidates with confidence)       │
       │ verify           (re-query telemetry on top hypothesis) │
       ▼                                                         │
[proposing]                                                      │
       │ propose          (remediation card + blast radius)      │
       ▼                                                         │
[awaiting_approval] ←──── (human OR auto-policy)                 │
       │                                                         │
       │ approved                rejected                        │
       ▼                            │                            │
[executing]                         │                            │
       │ execute_remediation        │                            │
       ▼                            │                            │
[verifying]                         │                            │
       │ verify_fix (poll metrics)  │                            │
       │                            ▼                            │
       │                       [failed] ─── notify, exit         │
       ▼                                                         │
[resolved] ─── rca + notify ─── done                             │
                                                                 │
       (errors at any step → [failed] with cause logged) ───────┘
```

`app/agent/state.py` implements transitions as a `StateMachine` with explicit `can_transition(from, to)` checks. Every transition writes to `audit_log`.

---

## 7. Tool definitions (registered with Agent Builder)

| Tool | Input | Output | Side effects |
|---|---|---|---|
| `dt_get_active_problems` | `time_window_min` | `[Problem]` | none — cached |
| `dt_get_problem_detail` | `problem_id` | `ProblemDetail` | cached |
| `dt_get_traces` | `entity_id, time_window` | `[Trace]` (sampled) | cached |
| `dt_search_logs` | `entity_id, time_window, query` | `[LogLine]` | cached |
| `dt_get_metric` | `entity_id, metric, time_window` | `MetricSeries` | cached |
| `dt_get_deployments` | `service, time_window` | `[Deployment]` | cached |
| `propose_remediation` | `action, target, params, blast_radius` | `ack` | writes to incident |
| `verify_resolution` | `incident_id, metrics, threshold` | `{resolved: bool, evidence}` | re-queries DT |
| `write_rca` | `incident_id, root_cause, timeline, action_items` | `rca_id` | creates report |

All tool calls flow through `tool_handlers.py` which:
1. Logs to `tool_calls` subcollection.
2. Times the call.
3. Caches results per-incident (TTL = incident lifetime).
4. Increments token budget tracker.

---

## 8. Step-by-step Execution (~12 focused hours / 2 days)

Each step is a discrete commit. Each commit keeps the test suite green.

### Step 1 — Bootstrap (45m)
- `cd Google_Agent_Hackathon && uv init backend && cd backend`
- Add deps: fastapi, uvicorn[standard], pydantic, pydantic-settings, google-cloud-firestore, google-cloud-secret-manager, google-cloud-aiplatform, opentelemetry-distro, opentelemetry-exporter-otlp, httpx, pytest, pytest-asyncio, respx, ruff, mypy.
- Configure ruff, mypy, pytest.
- Skeleton `app/main.py` with health endpoints.
- `Dockerfile` (distroless), `.dockerignore`.
- Commit: `chore: bootstrap fastapi + tooling`

### Step 2 — Cloud Run + Cloud Build deploy (60m)
- `cloudbuild.yaml`: lint → typecheck → test → build → push → deploy.
- Wire repo to Cloud Build trigger on push to `main`.
- Deploy stub `/healthz` to Cloud Run; confirm URL returns 200.
- Commit: `chore(infra): cloud build + cloud run pipeline`

### Step 3 — Config + Secrets + Telemetry (45m)
- `config.py` — `Settings` (env vars: `GCP_PROJECT`, `FIRESTORE_DB`, `DYNATRACE_BASE_URL`, etc.).
- `infra/secrets.py` — Secret Manager wrapper with in-memory cache.
- `infra/telemetry.py` — OTel auto-instrumentation + OTLP exporter to Dynatrace.
- `infra/logging.py` — JSON logger with trace correlation.
- Commit: `feat(infra): config, secrets, telemetry`

### Step 4 — Firestore + repositories (60m)
- `db/firestore.py` — async client.
- `db/repositories/*.py` — typed CRUD per collection.
- Models in `models/` mirror frontend shapes.
- Unit tests with `mockfirestore` library.
- Commit: `feat(db): firestore repos + models`

### Step 5 — Tenant resolution (30m)
- `services/tenant_service.py` — resolve tenant from request, fetch DT token from Secret Manager.
- Header-based tenant for hackathon (`X-Aegis-Tenant`); design supports OAuth later.
- Commit: `feat(tenants): resolution + secrets`

### Step 6 — Dynatrace MCP client (90m)
- `mcp/dynatrace_client.py` — async wrapper around the MCP server, one method per tool from Section 7.
- `mcp/cache.py` — per-incident memoization.
- Integration test using `respx` to mock MCP HTTP responses.
- Commit: `feat(mcp): dynatrace client + cache`

### Step 7 — Webhook ingest (60m)
- `api/webhooks.py` — POST handler with HMAC verify, idempotency check via `alert_hash`.
- `services/webhook_service.py` — orchestrates verify → idempotency → create incident → spawn agent.
- Unit + integration tests (replay attacks, malformed payloads, signature mismatch).
- Commit: `feat(api): dynatrace webhook ingest`

### Step 8 — State machine (45m)
- `agent/state.py` — `IncidentState` enum, `StateMachine` with explicit transitions.
- Unit tests covering every legal + illegal transition.
- Commit: `feat(agent): incident state machine`

### Step 9 — Agent Builder + Gemini 3 + prompts (90m)
- `agent/builder.py` — Agent Builder client wired to Gemini 3 Pro.
- `agent/prompts.py` — SRE system prompt (~600 words) + 2 few-shot incidents.
- `agent/tools.py` — tool schemas in Agent Builder format.
- `agent/tool_handlers.py` — dispatch table to MCP client / internal handlers.
- `agent/token_budget.py` — per-incident cap with `BudgetExceeded` exception.
- Commit: `feat(agent): builder + gemini 3 + tools`

### Step 10 — Orchestrator (the 10-step loop) (120m)
- `agent/orchestrator.py` — `async def run(incident_id)` runs the state machine.
- Each step calls Gemini via Agent Builder, writes an `AgentEvent` to Firestore.
- Verification step re-queries telemetry before proposing.
- Pauses at `awaiting_approval` (returns; resumes on approval webhook).
- Integration test with mocked Gemini responses (canned JSON) running full happy path.
- Commit: `feat(agent): orchestrator loop`

### Step 11 — SSE stream endpoint (60m)
- `api/stream.py` — `GET /stream/{id}` returns `text/event-stream`.
- `services/stream_service.py` — Firestore listener tailing `agent_events`, ordered by `seq`.
- Supports `?from_seq=N` for reconnect/replay.
- Heartbeat every 15s.
- Commit: `feat(api): SSE stream of agent events`

### Step 12 — Approval + remediation execution (75m)
- `api/approve.py` — `POST /incidents/{id}/approve` with body `{approved: bool, note?}`.
- `services/approval_service.py` — verifies state, executes via Dynatrace API (rollback, scale), records audit.
- `safety/policy.py` — evaluates auto-approval policy.
- `safety/guardrails.py` — allow-list of action types per tenant.
- Resumes orchestrator into verify_fix → rca.
- Commit: `feat(api): approval + remediation`

### Step 13 — RCA generation (45m)
- `services/rca_service.py` — Gemini-generated structured doc: timeline, root cause, contributing factors, action items, links.
- Stored in `rca_reports/`, linked from incident.
- Commit: `feat(rca): post-incident report generation`

### Step 14 — Dogfood metrics endpoint (30m)
- `api/dogfood.py` — `GET /dogfood/metrics` returns Aegis's own telemetry pulled from Dynatrace (requests/min, p95, error rate, status).
- The "Aegis observes Aegis" panel calls this.
- Commit: `feat(dogfood): self-metrics endpoint`

### Step 15 — Demo seed script + fire-incident script (45m)
- `scripts/seed_demo_tenant.py` — creates demo tenant + secrets.
- `scripts/fire_demo_incident.py` — POSTs a deterministic alert to the webhook for video recording.
- Document in README.
- Commit: `chore(demo): seed + fire scripts`

### Step 16 — Test coverage to 80% + load smoke test (75m)
- Fill gaps to hit ≥80% line coverage (global rule).
- `scripts/load_test.py` — fires 10 concurrent webhooks, asserts all complete.
- Commit: `test: coverage to 80% + smoke load`

### Step 17 — README + observability dashboard (45m)
- `backend/README.md` — quickstart, env vars, architecture diagram, deploy steps.
- Add Dynatrace dashboard JSON (or link) showing Aegis's own SLOs.
- Commit: `docs: backend readme + dashboard`

**Total: ~13 focused hours / 2 working days.**

---

## 9. Key Files

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI app, OTel + logging setup, lifespan management |
| `app/agent/orchestrator.py` | The 10-step state machine — the heart |
| `app/agent/state.py` | Explicit transitions, guards |
| `app/agent/prompts.py` | SRE system prompt + few-shot — biggest quality lever |
| `app/agent/tool_handlers.py` | Bridge between Gemini tool calls and Dynatrace MCP |
| `app/mcp/dynatrace_client.py` | Single point of contact with the partner |
| `app/api/webhooks.py` | Ingress — signature, idempotency, spawn |
| `app/api/stream.py` | SSE — frontend lifeline |
| `app/api/approve.py` | Human-in-the-loop — safety story |
| `app/safety/policy.py` | Approval evaluation — gate on dangerous actions |
| `app/services/rca_service.py` | Post-incident doc — closing the loop |
| `cloudbuild.yaml` | CI/CD — green build = deployable |
| `scripts/fire_demo_incident.py` | The button you press during video recording |

---

## 10. Risks and Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Dynatrace MCP API access delayed | Medium | High | Build against a mocked MCP module from day 1; swap in real client when access lands. `respx` fixtures double as test data + dev fallback. |
| Cloud Run request timeout during long agent run | Low | High | Agent runs <5 min; Cloud Run cap is 60 min. Monitor + add Cloud Tasks fallback if we breach 15 min in testing. |
| Gemini 3 token bill spikes | Medium | Medium | `token_budget.py` per-incident cap; structured prompts kept lean; aggressive caching of MCP responses (each call typed + identical inputs return cached). |
| Agent hallucinates wrong root cause → bad fix | High | Critical | Mandatory verification step re-queries telemetry; human approval default required; `safety/guardrails.py` action allow-list; rollback is always reversible by design. |
| Firestore listener disconnects mid-stream | Medium | Medium | SSE supports `?from_seq=N`; frontend reconnects from last received seq; events are append-only so replay is safe. |
| Webhook signature secret leaks → injection | Low | Critical | Secret Manager only; rotated by `tenant_service`; HMAC verification before any DB write; rate-limit at Cloud Armor. |
| Multi-tenant data leak | Low | Critical | Every repository method requires `tenant_id`; Firestore rules enforce tenant scoping; integration test asserts cross-tenant read fails. |
| Demo-day Gemini API outage | Low | Critical | Pre-record a flawless run; have `MOCK_GEMINI=1` env flag to play canned responses if needed for the video. |
| OpenTelemetry export overhead | Low | Low | Async exporter; sample at 10% for high-volume traces; agent steps always sampled at 100% for replayability. |

---

## 11. Test plan

### Unit (must pass before each commit)
- State machine transitions (legal + illegal each have tests).
- Webhook signature verification (positive, negative, replay).
- Idempotency dedupe.
- Token budget tripping.
- Approval policy evaluation.
- Tool handler dispatch.

### Integration (run on CI)
- Webhook → incident creation → orchestrator spawn (with mocked Gemini + MCP).
- SSE endpoint replays from seq=0 and tails new events.
- Approval flow executes the right Dynatrace API call (mocked).
- Cross-tenant isolation: tenant A cannot read tenant B's incidents.

### Smoke
- Fire 10 concurrent demo incidents → all reach `resolved` or `awaiting_approval` within 5 min.

### Coverage gate
- ≥80% line coverage (global rule). Fail CI under threshold.

---

## 12. Security checklist (run before submit)

- [ ] No hardcoded secrets (verified by `gitleaks` in CI).
- [ ] All user input validated via Pydantic at the boundary.
- [ ] HMAC signature verification on all incoming webhooks.
- [ ] Idempotent webhook handler.
- [ ] Rate limiting on `/webhooks/*` and `/approve` (Cloud Armor or `slowapi`).
- [ ] No SQL/NoSQL injection paths (Firestore SDK only, no raw queries).
- [ ] Error responses don't leak stack traces or secrets.
- [ ] Per-tenant secrets in Secret Manager, never in Firestore.
- [ ] CORS restricted to frontend Vercel domain.
- [ ] Authorization header on all `/api/*` except `/webhooks/*` (which uses HMAC).
- [ ] Audit log of every approval + execution.

---

## 13. Hand-off to frontend

Wire contract (matches `frontend/src/lib/mock-incident.ts` already):

```ts
// SSE event payload
type AgentEvent = {
  seq: number;
  step: "classify"|"gather"|"correlate"|"hypothesize"|"verify"|"propose"|"execute"|"verify_fix"|"rca";
  ts: string;            // ISO
  duration_ms: number;
  summary?: string;
  payload?: Record<string, any>;
  tool_call?: {
    name: string;
    input: Record<string, any>;
    output: Record<string, any>;
  };
  confidence?: number;   // 0-100, only on hypothesize/verify
};
```

Frontend swap:
```ts
// Before
const events = mockIncident.agentEvents;
// After
const events = useAgentStream(incidentId); // hits GET /api/stream/{id}
```

No frontend component refactor needed.

---

## 14. Open decisions (for you)

1. **Auth model for frontend → backend** — Clerk JWT verified by backend? Firebase Auth (more GCP-native)? Or skip auth for hackathon demo? Recommended: **Clerk JWT verified via JWKS** (cheap, clean, looks professional in code).
2. **Per-incident token budget cap** — recommend **200K input tokens / incident**. Tunable in `config.py`.
3. **Default auto-approval policy** — recommend **off by default** (every action requires human approval). Toggle in `tenants/{id}.approval_policy`.
4. **Demo data scope** — only run against Dynatrace's free trial demo app, or also wire a small Node.js service we deploy ourselves? Recommended: **use Dynatrace's demo app** to reduce moving parts.

---

## 15. SESSION_ID

- **CODEX_SESSION:** _(not generated — codeagent wrapper not installed locally; backend-specialist analysis synthesized inline by Claude.)_

---

## 16. Immediate next 3 actions

1. **Confirm open decisions in Section 14** (or accept the recommended defaults).
2. After confirmation: execute frontend bootstrap first (10h, Vercel-deployable by end), then backend bootstrap (13h, Cloud Run-deployable by end).
3. Both plans are forward-compatible: frontend mock-data shape == backend SSE event shape, so the integration cutover is a one-line swap.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Aegis** — Autonomous SRE Agent for the Google Agent Hackathon (Dynatrace Partner Track). Receives Dynatrace incident webhooks, runs a 10-step plan→execute→verify loop with Gemini, streams reasoning to a Next.js war-room UI via SSE, and waits for human approval before any write action.

## Common Commands

### Backend (Python 3.12, FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Health: `GET http://localhost:8000/health` (reports `dynatrace_mode` and `gemini_configured`)
- Auto-generated docs: `/docs`
- Trigger a fake incident (drives the full agent loop end-to-end):
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:8000/api/webhooks/dynatrace" `
    -Method Post -ContentType "application/json" `
    -Body '{"ProblemID":"P-001","ProblemTitle":"High response time on checkout-service","State":"OPEN","ProblemSeverity":"PERFORMANCE","ImpactedEntities":[{"type":"SERVICE","name":"checkout-service","entity":"SERVICE-ABC123"}]}'
  ```

### Frontend (Next.js 16, pnpm, biome — not eslint/prettier)
```bash
cd frontend
pnpm install
pnpm dev       # http://localhost:3000
pnpm build
pnpm lint      # biome check src
pnpm format    # biome format --write src
```
There is no test runner wired up in either tree yet.

### Deploy
- Backend → Cloud Run via `infrastructure/cloudbuild.yaml` (`gcloud builds submit`)
- Frontend → Vercel (no config in repo)

## Architecture — The Big Picture

### The 10-step agent loop (`backend/app/agent/orchestrator.py`)
This is the brain. A Dynatrace webhook (`api/webhooks.py`) creates an `Incident` in `services/store.py` and schedules `trigger_investigation()` which spawns an asyncio task running:

1. CLASSIFY → 2. GATHER → 3. CORRELATE → 4. HYPOTHESIZE → 5. VERIFY → 6. PROPOSE → 7. AWAIT (human approval) → 8. EXECUTE → 9. VERIFY_FIX → 10. RCA

Steps 1–7 run on `_run_investigation`. Steps 8–10 run on `_execute_and_verify`, kicked off by `POST /api/approve`. Every step appends an `AgentStep` to the incident and emits a structured event via `event_bus.publish(incident_id, ...)`.

### Live UI = event_bus → SSE
- `services/event_bus.py` is an in-memory pub/sub keyed by incident_id (swap for Redis/Cloud Pub/Sub in prod).
- `api/stream.py` (`GET /api/stream/{id}`) subscribes a queue and streams via `sse-starlette`. Closes the stream when it sees `incident_resolved`, `agent_complete`, or `error`. Keepalive every 30s.
- Frontend consumes via `frontend/src/hooks/useAegis.ts::useAgentStream` (EventSource).

### Two parallel agent runtimes — know which one you're touching
1. **`agent/gemini_engine.py`** — direct `google-genai` SDK calls with structured-JSON prompts per step. **This is what the orchestrator actually uses** during a live incident loop. Has hand-rolled fallbacks when Gemini is unconfigured or returns invalid JSON.
2. **`agent/adk_agent.py`** — Google ADK `Agent` + `FunctionTool` wrappers around `dt_client`. Used **only** by `POST /api/adk/investigate` as a demo surface for hackathon judges. Has graceful `ImportError` fallback so a missing `google-adk` install doesn't break the endpoint.

Don't try to unify these unless asked — they have different consumers.

### Dynatrace MCP client modes (`backend/app/mcp/dynatrace_client.py`)
Singleton `dt_client` with one of three auto-selected modes (see `DynatraceMCPClient.mode`):
- `mcp` — JSON-RPC 2.0 over HTTP to `DYNATRACE_MCP_ENDPOINT` (uses `tools/call` per MCP spec)
- `direct` — REST v2 against `DYNATRACE_TENANT_URL` with `DYNATRACE_API_TOKEN`
- `mock` — built-in `_mock_*` methods returning realistic synthetic data

Every high-level method (`get_problems`, `get_metrics`, `get_logs`, `get_traces`, `get_deployments`) falls through MCP → REST → mock in that order, so demos work with zero env vars.

### Config (`backend/app/config.py`)
Pydantic-settings `BaseSettings` reading `backend/.env`. Required env vars are all optional — every absent value degrades to mock or in-memory behavior. Mode toggles are derived from which vars are set, not from a `MODE=` flag.

### Frontend architecture
- Next.js 16 App Router with two route groups:
  - `app/(app)/dashboard/`, `app/(app)/incidents/`, `app/(app)/incidents/[id]/` — the real product surface
  - `app/_style/` (URL: `/_style`) — internal style-guide / design-system playground; not a customer route
- `frontend/src/hooks/useAegis.ts` is the single integration point with the backend (polling fetch hooks + EventSource for streams). All API calls go through `NEXT_PUBLIC_API_URL`.
- State strategy is intentionally minimal: server state via interval polling + SSE; no React Query/Zustand.

## Non-Obvious Constraints

### Next.js 16 has breaking changes from your training data
`frontend/AGENTS.md` says it bluntly: APIs, conventions, and file structure may differ from what you know. Before writing or refactoring any Next-specific code (routing, server actions, fonts, headers, caching), read the relevant page under `frontend/node_modules/next/dist/docs/`. Heed deprecation notices in the build output.

### Typography is locked — never substitute Inter / generic fonts
`gan-harness/spec.md` defines a locked aesthetic ("Late-shift editorial / mission-control broadsheet"). The font stack is **Fraunces** (variable, with `SOFT` / `WONK` / `opsz` axes — see `app/layout.tsx`), **Onest**, **JetBrains Mono**. Do not swap to Inter, Geist, or any default. Do not animate layout-bound CSS properties — `transform`/`opacity` only (this is why commit `e892f23` exists).

### `gan-harness/eval-rubric.md` is the acceptance bar
Frontend changes are evaluated against the rubric there. The `gan-harness/` directory is harness infrastructure, not product code — don't refactor it as part of feature work.

### Webhook → background task pattern
Endpoints that kick off the agent loop (`api/webhooks.py`, `api/approve.py`) return immediately and spawn work via `asyncio.create_task`. The HTTP response is *not* the result — the result streams over `/api/stream/{id}`. Don't wrap orchestrator calls in `await` from a request handler; you'll block the response and stall the SSE consumer.

### In-memory stores are intentional
`services/store.py` (incidents) and `services/event_bus.py` (pub/sub) are dict-backed singletons. Hackathon scope — don't introduce a database or queue without being asked.

## Reference Docs in the Repo
- `README.md` — public-facing pitch, architecture diagram, API table
- `docs/ARCHITECTURE.md`, `docs/DEMO_SCRIPT.md`, `docs/MONETIZATION.md`
- `.claude/plan/aegis-{sre-agent,backend-bootstrap,frontend-bootstrap}.md` — original planning docs from the multi-model planning sessions; useful for "why is it built this way"
- `gan-harness/spec.md` — locked design brief; `eval-rubric.md` — scoring rubric

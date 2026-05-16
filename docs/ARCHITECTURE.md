# Architecture

## System Overview

Aegis is an autonomous SRE (Site Reliability Engineering) agent that integrates with Dynatrace via MCP (Model Context Protocol) to detect, diagnose, and resolve production incidents in real-time.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser Client (Next.js 15)                                     │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐   │
│  │ Landing   │ │Dashboard │ │ Incident │ │   Settings     │   │
│  │ Page      │ │ View     │ │ Detail   │ │   Panel        │   │
│  └───────────┘ └──────────┘ └──────────┘ └────────────────┘   │
│         ↕ SSE + REST API                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│  Backend API (FastAPI on Cloud Run)                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Layer                                                │  │
│  │  /api/incidents  — CRUD operations                       │  │
│  │  /api/webhooks   — Dynatrace alert ingest                │  │
│  │  /api/stream     — SSE for live agent reasoning          │  │
│  │  /api/approve    — Remediation approval workflow         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Agent Orchestrator                                       │  │
│  │  10-step reasoning loop:                                  │  │
│  │  CLASSIFY → GATHER → CORRELATE → HYPOTHESIZE → VERIFY   │  │
│  │  → PROPOSE → AWAIT → EXECUTE → VERIFY_FIX → RCA        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Services                                                 │  │
│  │  EventBus (SSE pub/sub)  |  IncidentStore  |  RCA Gen   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                     ↕                    ↕
        ┌────────────────────┐  ┌──────────────────┐
        │  Dynatrace MCP     │  │  Google Cloud     │
        │  - Problems API    │  │  - Agent Builder  │
        │  - Logs API        │  │  - Gemini 3 Pro   │
        │  - Metrics API     │  │  - Firestore      │
        │  - Traces API      │  │  - Secret Manager │
        │  - Deployments API │  │  - Cloud Run      │
        └────────────────────┘  └──────────────────┘
```

## Data Flow

### Incident Lifecycle

1. **Detection**: Dynatrace detects an anomaly and fires a webhook
2. **Ingestion**: `/api/webhooks/dynatrace` receives the alert, creates an Incident
3. **Investigation**: Agent Orchestrator runs the 10-step reasoning loop
4. **Streaming**: Each step emits events via EventBus → SSE → Browser
5. **Approval**: Engineer reviews and approves/rejects remediation
6. **Execution**: Approved action executed via Dynatrace/Cloud APIs
7. **Verification**: Post-remediation metrics polled to confirm resolution
8. **Documentation**: RCA report auto-generated and stored

### Real-Time Communication

- **SSE (Server-Sent Events)** for server→client streaming
- **REST API** for client→server actions (approve, create incident)
- **EventBus** (in-memory pub/sub) for internal event routing

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| SSE over WebSocket | Simpler, HTTP-native, sufficient for one-directional streaming |
| In-memory store first | Fast iteration; Firestore swap is interface-compatible |
| Mock MCP fallback | Enables development/demo without live Dynatrace tenant |
| 10-step structured loop | Predictable, auditable, visualizable reasoning process |
| Human-in-the-loop | Safety requirement — no write actions without approval |

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS | UI framework |
| Animations | Framer Motion | Premium motion design |
| Backend | FastAPI, Python 3.12 | API server |
| AI | Gemini 3 Pro, Agent Builder | Reasoning engine |
| Data Source | Dynatrace MCP | Observability telemetry |
| Storage | Cloud Firestore | Persistent data |
| Hosting | Vercel + Cloud Run | Scalable deployment |
| CI/CD | Cloud Build | Automated deploys |

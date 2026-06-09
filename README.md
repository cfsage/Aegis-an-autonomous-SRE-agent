<p align="center">
  <img src="docs/assets/aegis-logo.svg" alt="Aegis Logo" width="120" />
</p>

<h1 align="center">Aegis — Autonomous SRE Agent</h1>

<p align="center">
  <strong>Your AI Site Reliability Engineer. It takes the page so you don't have to.</strong>
</p>

<p align="center">
  <a href="#demo">Demo Video</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#features">Features</a> •
  <a href="docs/MONETIZATION.md">Monetization</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Google%20ADK-Agent%20Development%20Kit-4285F4?style=flat-square&logo=google-cloud" />
  <img src="https://img.shields.io/badge/Gemini%202.5-Pro-8E75B2?style=flat-square&logo=google" />
  <img src="https://img.shields.io/badge/Dynatrace-MCP%20Protocol-6F2DA8?style=flat-square&logo=dynatrace" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## The Problem

Every SRE team faces the same nightmare: **3 AM pages, manual log-diving, and post-incident reports nobody wants to write.** The average incident takes 47 minutes to diagnose — most of that time is spent correlating signals humans can see but struggle to connect under pressure.

## The Solution

**Aegis** is an autonomous SRE agent that receives incident alerts from Dynatrace, reasons through the problem live, identifies root causes with confidence scores, proposes remediations, and — with human approval — executes fixes and writes the post-incident report.

It reduces Mean Time To Resolution (MTTR) from 47 minutes to under 60 seconds.

---

## Demo & Walkthrough

> 🎬 [View UI Screenshots & Autonomous Run WebP Recordings →](docs/WALKTHROUGH.md)

<p align="center">
  <em>Aegis detecting a latency spike, correlating with a recent deployment, proposing a rollback, and resolving the incident — all in real-time.</em>
</p>

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Next.js 16 App)                                    │
│  Dashboard · Incidents List · War Room · Style Guide         │
│  SSE consumer for live agent reasoning                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + SSE
┌──────────────────────────▼──────────────────────────────────┐
│  FastAPI on Cloud Run                                        │
│  /api/incidents · /api/webhooks · /api/stream · /api/adk     │
└────────┬────────────┬────────────────────────┬──────────────┘
         │            │                        │
         ▼            ▼                        ▼
   ┌──────────┐ ┌─────────────┐    ┌──────────────────────┐
   │In-memory │ │Secret Mgr   │    │ Google ADK Agent     │
   │Store     │ │             │    │ + Gemini 2.5 Pro     │
   └──────────┘ └─────────────┘    └──────┬───────────────┘
                                          │
                ┌─────────────────────────┼──────────────────┐
                ▼                         ▼                  ▼
        ┌──────────────────┐    ┌─────────────────┐ ┌──────────────┐
        │ Dynatrace MCP    │    │ Internal tools  │ │ Notify tool  │
        │ (JSON-RPC 2.0)   │    │ (rca, hypothesis│ │ (Slack/Email)│
        │ problems, logs   │    │  verify)        │ │              │
        │ metrics, traces  │    │                 │ │              │
        └──────────────────┘    └─────────────────┘ └──────────────┘
```

### Agent Reasoning Loop

1. **CLASSIFY** → Severity, blast radius, affected services
2. **GATHER** → Query Dynatrace MCP for problems, traces, logs, deployments
3. **CORRELATE** → Align timeline of signals + recent changes
4. **HYPOTHESIZE** → Enumerate candidate root causes with confidence scores
5. **VERIFY** → Re-query telemetry to confirm/refute top hypothesis
6. **PROPOSE** → Remediation: rollback / scale / flag / manual runbook
7. **AWAIT** → Human approval (or policy-auto-approve)
8. **EXECUTE** → Apply via Dynatrace / Cloud APIs
9. **VERIFY_FIX** → Re-poll metrics, confirm resolution
10. **RCA** → Auto-generate post-incident report

---

## Partner Integration

### Dynatrace MCP Server

Aegis integrates with Dynatrace via the **Model Context Protocol (MCP)** — a standard for connecting AI agents with external tools. The integration supports three modes:

| Mode | Transport | Description |
|------|-----------|-------------|
| **MCP** | JSON-RPC 2.0 over HTTP | Full protocol compliance with `tools/call` and `tools/list` |
| **Direct** | REST API | Falls back to Dynatrace REST v2 APIs when MCP endpoint unavailable |
| **Mock** | In-memory | Realistic mock data for development/demo |

**MCP Tools registered:**
- `dynatrace-problems-list` — Active problems and anomalies
- `dynatrace-metrics-query` — Response time, error rate, throughput
- `dynatrace-logs-search` — Error pattern detection
- `dynatrace-traces-search` — Distributed trace analysis
- `dynatrace-events-list` — Deployment event correlation

### Google ADK (Agent Development Kit)

The agent is built using the **Google ADK** (`google-adk`) framework, which provides:
- Structured agent definition with system prompts
- Automatic tool registration and invocation
- Gemini 2.5 Pro as the reasoning backbone
- `InMemoryRunner` for session management

---

## Features

- 🧠 **Live Reasoning** — Watch the agent think step-by-step as it diagnoses incidents
- 📊 **Confidence Telemetry** — Every hypothesis comes with evidence and a 0–100 score
- 🔒 **Human-in-the-Loop** — No write action without explicit approval (or policy)
- 📋 **Audit Ledger** — Every tool call, decision, and approval is logged and exportable
- 📝 **Auto RCA** — Structured post-incident reports generated automatically
- 🎨 **Premium Design** — "Dark Editorial" aesthetic with OKLCH colors, Fraunces serif type, persimmon ember accents

---

## Quickstart

### Prerequisites

- Node.js 20+ / pnpm
- Python 3.12+
- Google Cloud account (optional — for live Gemini)
- Dynatrace tenant (optional — mock data available)

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Environment Variables

```env
# Backend (.env file in backend/)
GEMINI_API_KEY=your-gemini-key           # For live AI reasoning
DYNATRACE_TENANT_URL=https://xxx.live.dynatrace.com  # Optional
DYNATRACE_API_TOKEN=dt0c01.xxxx          # Optional
DYNATRACE_MCP_ENDPOINT=http://localhost:9876  # Optional MCP server

# Frontend (.env.local in frontend/)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Test: Trigger an Incident

```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/api/webhooks/dynatrace" `
  -Method Post -ContentType "application/json" `
  -Body '{"ProblemID":"P-001","ProblemTitle":"High response time on checkout-service","State":"OPEN","ProblemSeverity":"PERFORMANCE","ImpactedEntities":[{"type":"SERVICE","name":"checkout-service","entity":"SERVICE-ABC123"}]}'
```

Then open `http://localhost:3000/dashboard` to see the agent working.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with Dynatrace mode and Gemini status |
| `/api/incidents` | GET | List all incidents |
| `/api/incidents/metrics` | GET | Dashboard aggregated metrics |
| `/api/incidents/{id}` | GET | Full incident detail with agent steps |
| `/api/webhooks/dynatrace` | POST | Receive Dynatrace problem webhooks |
| `/api/stream/{id}` | GET (SSE) | Real-time agent reasoning event stream |
| `/api/approve` | POST | Approve or reject a remediation |
| `/api/adk/investigate` | POST | ADK-powered investigation endpoint |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind v4, Framer Motion |
| Design | OKLCH tokens, Fraunces serif, "Dark Editorial" system |
| Backend | Python 3.12, FastAPI, Pydantic v2 |
| AI Agent | Google ADK, Gemini 2.5 Pro |
| Observability | Dynatrace MCP (JSON-RPC 2.0) |
| Hosting | Cloud Run (backend), Vercel (frontend) |

---

## License

[MIT](LICENSE) — Open source, as required by hackathon rules.

---

<p align="center">
  Built for the <strong>Google Agent Hackathon</strong> — Dynatrace Partner Track
</p>

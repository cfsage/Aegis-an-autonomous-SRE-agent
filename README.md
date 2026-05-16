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
  <img src="https://img.shields.io/badge/Google%20Cloud-Agent%20Builder-4285F4?style=flat-square&logo=google-cloud" />
  <img src="https://img.shields.io/badge/Gemini%203-Pro-8E75B2?style=flat-square&logo=google" />
  <img src="https://img.shields.io/badge/Dynatrace-MCP-6F2DA8?style=flat-square&logo=dynatrace" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

---

## The Problem

Every SRE team faces the same nightmare: **3 AM pages, manual log-diving, and post-incident reports nobody wants to write.** The average incident takes 47 minutes to diagnose — most of that time is spent correlating signals humans can see but struggle to connect under pressure.

## The Solution

**Aegis** is an autonomous SRE agent that receives incident alerts from Dynatrace, reasons through the problem live, identifies root causes with confidence scores, proposes remediations, and — with human approval — executes fixes and writes the post-incident report.

It reduces Mean Time To Resolution (MTTR) from 47 minutes to under 60 seconds.

---

## Demo

> 🎬 [Watch the 3-minute demo →](#)

<p align="center">
  <em>Aegis detecting a latency spike, correlating with a recent deployment, proposing a rollback, and resolving the incident — all in real-time.</em>
</p>

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Next.js 15 App)                                    │
│  Marketing Landing · Dashboard · Incident Detail · Settings  │
│  SSE consumer for live agent reasoning                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS + SSE
┌──────────────────────────▼──────────────────────────────────┐
│  FastAPI on Cloud Run                                        │
│  /api/incidents · /api/webhooks · /api/stream · /api/approve │
└────────┬────────────┬────────────────────────┬──────────────┘
         │            │                        │
         ▼            ▼                        ▼
   ┌──────────┐ ┌─────────────┐    ┌──────────────────────┐
   │Firestore │ │Secret Mgr   │    │ Agent Builder runtime│
   │          │ │             │    │ + Gemini 3 Pro       │
   └──────────┘ └─────────────┘    └──────┬───────────────┘
                                          │
                ┌─────────────────────────┼──────────────────┐
                ▼                         ▼                  ▼
        ┌──────────────────┐    ┌─────────────────┐ ┌──────────────┐
        │ Dynatrace MCP    │    │ Internal tools  │ │ Notify tool  │
        │ (problems,traces,│    │ (rca, hypothesis│ │ (Slack/Email)│
        │  logs,metrics)   │    │  verify)        │ │              │
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

## Features

- 🧠 **Live Reasoning** — Watch the agent think token-by-token as it diagnoses incidents
- 📊 **Confidence Telemetry** — Every hypothesis comes with evidence and a 0–100 score
- 🔒 **Human-in-the-Loop** — No write action without explicit approval (or policy)
- 📋 **Audit Ledger** — Every tool call, decision, and approval is logged and exportable
- 🚨 **War Room Mode** — P0 incidents shift the UI into high-contrast emergency mode
- 🪞 **Meta-Observability** — Aegis monitors itself via Dynatrace (the loop closes)
- 📝 **Auto RCA** — Structured post-incident reports generated automatically

---

## Quickstart

### Prerequisites

- Node.js 20+ / pnpm
- Python 3.12+
- Google Cloud account with Agent Builder enabled
- Dynatrace tenant with API access

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
uvicorn app.main:app --reload
```

### Environment Variables

```env
# Backend
GOOGLE_CLOUD_PROJECT=your-project-id
DYNATRACE_TENANT_URL=https://your-tenant.live.dynatrace.com
DYNATRACE_API_TOKEN=dt0c01.xxxx
GEMINI_API_KEY=your-gemini-key
FIRESTORE_PROJECT_ID=your-project-id

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxxx
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Python 3.12, FastAPI, Pydantic v2 |
| AI | Gemini 3 Pro, Google Cloud Agent Builder |
| Data | Dynatrace MCP Server |
| Storage | Cloud Firestore |
| Hosting | Vercel (frontend), Cloud Run (backend) |
| Auth | Clerk |

---

## License

[MIT](LICENSE) — Open source, as required by hackathon rules.

---

<p align="center">
  Built for the <strong>Google Agent Hackathon</strong> — Dynatrace Partner Track
</p>

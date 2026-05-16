# Demo Script — 3-Minute Video

## Target Duration: 3:00

---

## 0:00 – 0:15 | Hook

**[SCREEN: Black → Aegis logo fades in → Landing page hero]**

> "Every SRE team shares the same nightmare: the 3 AM page. Forty-seven minutes of frantic log-diving while users churn. What if your AI took the page instead?"

---

## 0:15 – 0:30 | Introduce Aegis

**[SCREEN: Landing page scrollytelling — camera scrolls through the 10-step timeline]**

> "Meet Aegis — an autonomous SRE agent powered by Gemini 3 and Dynatrace MCP. It doesn't just alert you. It investigates, diagnoses, and resolves incidents — in 38 seconds."

---

## 0:30 – 0:50 | Trigger the Incident

**[SCREEN: Dashboard showing normal metrics → Webhook fires → P1 incident appears with animation]**

> "Watch what happens when Dynatrace detects a latency spike on our checkout service. A webhook fires, Aegis opens an incident, and immediately begins investigating."

**[CLICK: Into the incident detail page]**

---

## 0:50 – 1:30 | Live Agent Reasoning

**[SCREEN: Incident detail — agent timeline animating step by step]**

> "Aegis classifies the incident — P1, checkout service, 2,400 users impacted."

**[Step 1 animates: CLASSIFY]**

> "It queries Dynatrace MCP — pulling traces, logs, metrics, and recent deployments."

**[Step 2 animates: GATHER — tool call cards appear]**

> "Correlates signals with the timeline: a deployment 3 minutes before the spike."

**[Step 3 animates: CORRELATE]**

> "Forms three hypotheses, ranked by confidence. The top one: deployment regression at 78%."

**[Step 4 animates: HYPOTHESIZE — hypothesis cards with confidence bars]**

> "Verifies by re-querying metrics. Confirmed at 88% confidence."

**[Step 5 animates: VERIFY — confidence jumps]**

---

## 1:30 – 2:00 | Remediation & Approval

**[SCREEN: Remediation proposal card — rollback details visible]**

> "Aegis proposes a rollback. Look at this: action, expected effect, blast radius, and a rollback plan — all structured. No black box."

> "As the engineer, I can approve with one click. Or reject if I disagree."

**[CLICK: Approve button → execution animation → verify fix → resolution banner with 38s MTTR]**

> "Approved. Deployed. Verified. 38 seconds from alert to resolution. The industry average? 47 minutes."

---

## 2:00 – 2:20 | Dashboard & Meta-Observability

**[SCREEN: Dashboard — MTTR metric, severity distribution, incident feed]**

> "The dashboard shows real-time MTTR, severity distribution, and every incident Aegis has handled."

**[PAN to: Aegis Observes Aegis panel]**

> "And here's the meta moment: Aegis monitors itself via Dynatrace. The observability loop closes."

---

## 2:20 – 2:40 | Safety & Audit

**[SCREEN: Settings page — approval policies, then incident audit trail]**

> "Safety isn't an afterthought. P0 and P1 incidents always require human approval. Lower severity? Auto-approve with policy. Every tool call, every decision is logged in an exportable audit trail."

---

## 2:40 – 3:00 | Close

**[SCREEN: Landing page hero → Architecture diagram → MIT License on GitHub]**

> "Aegis. Built with Gemini 3 Pro, Google Cloud Agent Builder, and Dynatrace MCP. Open source under MIT. Your AI SRE — so you can sleep through the night."

**[SCREEN: Logo + tagline: "It takes the page so you don't have to."]**

---

## Production Notes

- Record in 1080p, 60fps
- Use ScreenStudio or similar for smooth cursor + zoom
- Pre-warm all services before recording
- Have a fallback recording ready
- Background music: subtle, low-key ambient (licensed)
- Voiceover: calm, confident, conversational pace

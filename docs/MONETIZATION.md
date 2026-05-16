# Monetization Plan

## Market Opportunity

**Incident management is a $3.2B market growing at 12% CAGR.**

Every company with production services has incidents. The average MTTR across the industry is 47 minutes. SRE teams are expensive, overworked, and burned out. AI that reduces MTTR by 74x has obvious, quantifiable value.

## Target Customer Profile (ICP)

- **Company size**: 50–5,000 employees
- **Industry**: SaaS, fintech, e-commerce, health tech
- **Buyer**: VP Engineering, Head of Platform, SRE Team Lead
- **Pain**: Alert fatigue, slow MTTR, post-incident documentation debt
- **Budget**: Already paying for Dynatrace, PagerDuty, or similar

## Pricing Tiers

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | 1 Dynatrace connector, 100 incidents/month, community support |
| **Team** | $49/engineer/month | Unlimited incidents, Slack + PagerDuty integration, approval policies, audit log export, email support |
| **Enterprise** | Custom | SSO/SAML, on-prem deployment option, custom MCP connectors (Datadog, New Relic), SOC2, dedicated support, SLA |

## Go-to-Market Strategy

### Phase 1: Developer-Led Growth (Month 1–6)
- Open-source core with MIT license
- Show HN launch with demo video
- Dynatrace partner co-marketing (if hackathon win)
- Content marketing: "How we reduced MTTR from 47min to 38s" blog post
- Target 500 free tier signups

### Phase 2: Team Adoption (Month 6–12)
- Add Slack and PagerDuty integrations
- Launch Team tier with approval policies
- Partner with Dynatrace marketplace
- Target 50 paying teams

### Phase 3: Enterprise (Month 12–18)
- Add Datadog and New Relic MCP connectors
- SOC2 Type II certification
- On-prem deployment option
- Enterprise sales motion
- Target 10 enterprise accounts

## Revenue Projections

| Period | Free Users | Team Users | Enterprise | MRR |
|--------|-----------|------------|------------|-----|
| Month 6 | 500 | 20 | 0 | $4,900 |
| Month 12 | 2,000 | 100 | 2 | $34,500 |
| Month 18 | 5,000 | 300 | 10 | $114,700 |

## Competitive Moat

1. **Incident memory**: Historical incident data in Firestore becomes a learning dataset. Better recommendations over time.
2. **Approval policies**: Team-specific policies encoded per-org become switching cost.
3. **MCP integration depth**: Deep Dynatrace integration via MCP is hard to replicate with generic API wrappers.
4. **Human-in-the-loop UX**: The approval flow is a product surface, not just a model feature.

## Why It Survives "ChatGPT Could Do This"

- **Real-time telemetry loop**: Aegis queries live data via MCP, not pasted logs
- **Verification step**: Hypotheses are confirmed against fresh metrics, not stale context
- **Safety layer**: Human approval with blast-radius awareness is a product design choice
- **Audit trail**: Enterprise compliance requirement that generic AI chat lacks

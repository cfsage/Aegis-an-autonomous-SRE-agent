"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityChip, StatusPill } from "@/components/ui/tag";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AgentStep } from "@/components/incident/AgentStep";
import { EmberLoader } from "@/components/incident/EmberLoader";
import { HypothesisCard } from "@/components/incident/HypothesisCard";
import { Timestamp } from "@/components/incident/Timestamp";
import { GrainOverlay } from "@/components/layout/GrainOverlay";
import { Logo } from "@/components/layout/Logo";
import { TokenSwatch } from "@/components/style/TokenSwatch";
import { mockIncident } from "@/lib/mock-incident";
import type { Severity } from "@/types/incident";

const palette: Array<{ name: string; value: string; note?: string }> = [
  { name: "ink · canvas", value: "oklch(13% 0.008 250)", note: "Cold ink with blue undertone — not pure black." },
  { name: "ink · surface", value: "oklch(17% 0.010 250)", note: "Elevated card body." },
  { name: "ink · elevated", value: "oklch(22% 0.012 250)", note: "Tool call inner card." },
  { name: "bone", value: "oklch(96% 0.006 80)", note: "Primary text." },
  { name: "oyster", value: "oklch(78% 0.008 80)", note: "Secondary text, descriptions." },
  { name: "slate", value: "oklch(54% 0.010 250)", note: "Muted text, eyebrows." },
  { name: "grave", value: "oklch(38% 0.012 250)", note: "Dim text, past/resolved." },
  { name: "ember 400", value: "oklch(70% 0.20 35)", note: "PERSIMMON. Semantic accent only." },
  { name: "ember glow", value: "oklch(70% 0.20 35 / 0.32)", note: "Outer shadow color." },
  { name: "ice 400", value: "oklch(82% 0.13 200)", note: "Resolved / verified state only." },
];

const severities: Severity[] = ["P0", "P1", "P2", "P3"];

const easings = [
  { name: "ease-out-expo", curve: "cubic-bezier(0.16, 1, 0.3, 1)" },
  { name: "ease-out-quint", curve: "cubic-bezier(0.22, 1, 0.36, 1)" },
  { name: "ease-in-out-soft", curve: "cubic-bezier(0.65, 0, 0.35, 1)" },
  { name: "ease-out-quart", curve: "cubic-bezier(0.25, 1, 0.5, 1)" },
  { name: "spring-firm", curve: "stiffness 380, damping 32" },
  { name: "spring-soft", curve: "stiffness 220, damping 28" },
];

export default function StylePage() {
  const [grainOpacity, setGrainOpacity] = useState(0.035);

  return (
    <>
      <GrainOverlay opacity={grainOpacity} />

      {/* Masthead */}
      <header className="surface px-6 md:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <Logo />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--slate)]">
            style · v0.1 · living guide
          </span>
        </div>
        <h1
          className="font-display italic text-[color:var(--bone)]"
          style={{
            fontSize: "clamp(2.25rem, 1rem + 4vw, 3.5rem)",
            lineHeight: 1.02,
            letterSpacing: "-0.02em",
            fontVariationSettings: "'SOFT' 60, 'WONK' 1, 'opsz' 96",
          }}
        >
          The Aegis broadsheet
        </h1>
        <p className="mt-4 max-w-[60ch] text-[color:var(--oyster)] text-[15px]">
          A late-shift editorial design system for autonomous incident response.
          Cold ink, persimmon ember, Fraunces wonky-axis serifs. Every choice
          on this page is documented as a token in <code className="font-mono text-[12px] text-[color:var(--bone)]">tokens.css</code>.
        </p>
      </header>

      <div className="px-6 md:px-10 py-10 space-y-16">
        {/* ── Color ── */}
        <section aria-labelledby="palette-eyebrow">
          <h2 id="palette-eyebrow" className="eyebrow mb-6">
            color palette
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {palette.map((c) => (
              <TokenSwatch key={c.name} name={c.name} value={c.value} note={c.note} />
            ))}
          </div>
          <p className="mt-4 max-w-[68ch] text-[13px] text-[color:var(--oyster)]">
            Persimmon ember is never decorative — it appears only on active
            severity, anomaly bands, primary action, and the live status
            indicator. Ice cyan appears only on resolved states.
          </p>
        </section>

        {/* ── Typography ── */}
        <section aria-labelledby="type-eyebrow">
          <h2 id="type-eyebrow" className="eyebrow mb-6">typography</h2>

          <div className="space-y-8">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--slate)] mb-2">
                Fraunces · display · italic · opsz 144 · SOFT 60 · WONK 1
              </div>
              <p
                className="font-display italic text-[color:var(--bone)]"
                style={{
                  fontSize: "clamp(3rem, 2rem + 6vw, 6rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                  fontVariationSettings: "'SOFT' 60, 'WONK' 1, 'opsz' 144",
                }}
              >
                04:47
              </p>
            </div>

            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--slate)] mb-2">
                Fraunces · title · italic · opsz 96
              </div>
              <p
                className="font-display italic text-[color:var(--bone)]"
                style={{
                  fontSize: "clamp(1.75rem, 1rem + 2.5vw, 3rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  fontVariationSettings: "'SOFT' 60, 'WONK' 1, 'opsz' 96",
                }}
              >
                Checkout latency spike on shopping-cart-service
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="eyebrow mb-2">onest · ui body</div>
                <p className="text-[15px] text-[color:var(--bone)] mb-1">
                  The agent gathered three signals.
                </p>
                <p className="text-[13px] text-[color:var(--oyster)]">
                  Secondary descriptions live in oyster at 13–14px.
                </p>
                <p className="text-[12px] text-[color:var(--slate)] mt-2">
                  Muted captions in slate at 12px.
                </p>
              </div>

              <div>
                <div className="eyebrow mb-2">jetbrains mono · data</div>
                <p className="font-mono text-[13px] text-[color:var(--bone)] num mb-1">
                  4,847 req/min · p95 84ms
                </p>
                <p className="font-mono text-[12px] text-[color:var(--oyster)] num">
                  err 0.02% · slow_pct 41.2%
                </p>
                <p className="font-mono text-[11px] text-[color:var(--grave)]">
                  ▸ dynatrace.problems.get
                </p>
              </div>

              <div>
                <div className="eyebrow mb-2">small-caps eyebrow</div>
                <p
                  className="font-display text-[color:var(--bone)] text-[14px]"
                  style={{
                    fontVariantCaps: "all-small-caps",
                    letterSpacing: "0.12em",
                  }}
                >
                  Proposed Remediation
                </p>
                <p
                  className="font-display text-[color:var(--oyster)] text-[12px] mt-2"
                  style={{
                    fontVariantCaps: "all-small-caps",
                    letterSpacing: "0.12em",
                  }}
                >
                  Section subtitle
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Severity chips ── */}
        <section aria-labelledby="sev-eyebrow">
          <h2 id="sev-eyebrow" className="eyebrow mb-6">severity chips</h2>
          <p className="text-[13px] text-[color:var(--oyster)] max-w-[60ch] mb-5">
            Skewed parallelogram at -6° with a clipped lower-right corner. The
            label inside is counter-skewed (+6°) so the type reads upright.
            P0/P1 carry an outer ember glow; P2/P3 are inert.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            {severities.map((s) => (
              <SeverityChip key={s} severity={s} />
            ))}
          </div>
        </section>

        {/* ── Status pills ── */}
        <section aria-labelledby="status-eyebrow">
          <h2 id="status-eyebrow" className="eyebrow mb-6">status pills</h2>
          <div className="flex flex-wrap items-center gap-6">
            <StatusPill status="open" />
            <StatusPill status="investigating" />
            <StatusPill status="proposing" />
            <StatusPill status="awaiting" />
            <StatusPill status="resolved" />
          </div>
        </section>

        {/* ── Buttons ── */}
        <section aria-labelledby="btn-eyebrow">
          <h2 id="btn-eyebrow" className="eyebrow mb-6">button variants</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Approve</Button>
            <Button variant="ghost">Reject</Button>
            <Button variant="subtle" trailing="↗">Modify</Button>
          </div>
        </section>

        {/* ── Agent step states ── */}
        <section aria-labelledby="step-eyebrow">
          <h2 id="step-eyebrow" className="eyebrow mb-6">agent step states</h2>
          <div className="surface max-w-[680px]">
            <ul>
              <AgentStep
                event={mockIncident.agentEvents[0]}
                state="completed"
              />
              <li className="block h-px ml-9 mr-4 bg-[color:var(--hairline-soft)]" />
              <AgentStep
                event={mockIncident.agentEvents[5]}
                state="current"
                defaultExpanded={false}
              />
              <li className="block h-px ml-9 mr-4 bg-[color:var(--hairline-soft)]" />
              <AgentStep
                event={mockIncident.agentEvents[7]}
                state="pending"
              />
            </ul>
          </div>
        </section>

        {/* ── Hypothesis card ── */}
        <section aria-labelledby="hyp-eyebrow">
          <h2 id="hyp-eyebrow" className="eyebrow mb-6">hypothesis card</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[900px]">
            {mockIncident.agentEvents[5].step === "hypothesize" &&
              mockIncident.agentEvents[5].payload.hypotheses.map((h, i) => (
                <HypothesisCard key={h.id} hypothesis={h} rank={i} />
              ))}
          </div>
        </section>

        {/* ── Hairline system ── */}
        <section aria-labelledby="hair-eyebrow">
          <h2 id="hair-eyebrow" className="eyebrow mb-6">hairline system</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[160, 220, 320].map((h) => (
              <div
                key={h}
                className="surface p-4"
                style={{ height: h }}
              >
                <div className="eyebrow mb-2">card · {h}px</div>
                <p className="text-[12px] text-[color:var(--oyster)]">
                  Top-edge highlight via ::before. Bottom hairline-soft border.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Motion easings ── */}
        <section aria-labelledby="motion-eyebrow">
          <h2 id="motion-eyebrow" className="eyebrow mb-6">motion easings</h2>
          <p className="text-[13px] text-[color:var(--oyster)] max-w-[60ch] mb-5">
            Click each tile — the dot slides on its named easing curve.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {easings.map((e) => (
              <EasingDemo key={e.name} {...e} />
            ))}
          </div>
        </section>

        {/* ── Grain overlay toggle ── */}
        <section aria-labelledby="grain-eyebrow">
          <h2 id="grain-eyebrow" className="eyebrow mb-6">grain overlay</h2>
          <div className="flex flex-wrap gap-3">
            {[0, 0.01, 0.035, 0.05].map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setGrainOpacity(op)}
                className={[
                  "px-3 py-2 font-mono text-[11px] tracking-[0.14em] uppercase",
                  "border",
                  grainOpacity === op
                    ? "border-[color:var(--ember-400)] text-[color:var(--ember-400)]"
                    : "border-[color:var(--hairline-mid)] text-[color:var(--oyster)] hover:border-[color:var(--hairline-bright)]",
                ].join(" ")}
              >
                {op === 0 ? "off" : `${(op * 100).toFixed(1)}%`}
              </button>
            ))}
          </div>
        </section>

        {/* ── Cards + form primitives ── */}
        <section aria-labelledby="prim-eyebrow">
          <h2 id="prim-eyebrow" className="eyebrow mb-6">supporting primitives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>card with header</CardTitle>
                <Badge tone="ember">live</Badge>
              </CardHeader>
              <CardBody>
                <p className="text-[13px] text-[color:var(--oyster)]">
                  Used everywhere a panel is needed. 3px corners,
                  hairline border, gradient top edge.
                </p>
                <Separator className="my-3" />
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge>service · cart</Badge>
                  <Badge tone="muted">deploy · abc1234</Badge>
                  <Badge tone="ice">resolved</Badge>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>form primitives</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                <Input placeholder="filter by service…" />
                <Select defaultValue="p1">
                  <SelectTrigger>
                    <SelectValue placeholder="severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p0">P0</SelectItem>
                    <SelectItem value="p1">P1</SelectItem>
                    <SelectItem value="p2">P2</SelectItem>
                    <SelectItem value="p3">P3</SelectItem>
                  </SelectContent>
                </Select>
                <Tabs defaultValue="timeline">
                  <TabsList>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="evidence">Evidence</TabsTrigger>
                    <TabsTrigger value="diff">Diff</TabsTrigger>
                  </TabsList>
                  <TabsContent value="timeline">
                    <p className="text-[12px] text-[color:var(--oyster)]">
                      8 agent events captured.
                    </p>
                  </TabsContent>
                  <TabsContent value="evidence">
                    <p className="text-[12px] text-[color:var(--oyster)]">
                      heap usage +180% post-deploy.
                    </p>
                  </TabsContent>
                  <TabsContent value="diff">
                    <p className="text-[12px] text-[color:var(--oyster)]">
                      abc1234 → abc1233 (revert).
                    </p>
                  </TabsContent>
                </Tabs>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* ── Timestamp + loader ── */}
        <section aria-labelledby="atom-eyebrow">
          <h2 id="atom-eyebrow" className="eyebrow mb-6">atoms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="surface px-4 py-3">
              <div className="eyebrow mb-2">timestamp · dimmed sub-second</div>
              <p className="text-[16px]">
                <Timestamp iso="14:23:11.247Z" />
              </p>
            </div>
            <div className="surface px-4 py-3">
              <div className="eyebrow mb-2">ember loader</div>
              <EmberLoader />
            </div>
          </div>
        </section>
      </div>

      <footer className="px-6 md:px-10 py-6 border-t border-[color:var(--hairline-soft)] flex items-center justify-between font-mono text-[10.5px] text-[color:var(--grave)]">
        <span>aegis-ops · style · v0.1</span>
        <span>cold ink · persimmon ember</span>
      </footer>
    </>
  );
}

function EasingDemo({ name, curve }: { name: string; curve: string }) {
  const [tick, setTick] = useState(0);
  const cubic = curve.startsWith("cubic") ? curve : "cubic-bezier(0.22,1,0.36,1)";
  return (
    <button
      type="button"
      onClick={() => setTick((t) => t + 1)}
      className="surface text-left px-3 py-3 relative overflow-hidden cursor-pointer hover:bg-[color:var(--ink-elevated)] transition-colors"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[color:var(--slate)]">
        {name}
      </div>
      <div className="font-mono text-[10.5px] text-[color:var(--grave)] mt-0.5 truncate">
        {curve}
      </div>
      <div className="relative h-6 mt-2 bg-[color:var(--hairline-soft)]/30">
        <motion.div
          key={tick}
          initial={{ x: 0 }}
          animate={{ x: "100%" }}
          transition={{ duration: 0.9, ease: cubic as unknown as number[] }}
          className="absolute top-0 left-0 h-full w-2 -translate-x-1/2"
          style={{
            background: "var(--ember-400)",
            boxShadow: "0 0 10px var(--ember-glow)",
          }}
        />
      </div>
    </button>
  );
}

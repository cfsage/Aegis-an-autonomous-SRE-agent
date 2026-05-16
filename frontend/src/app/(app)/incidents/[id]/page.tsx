"use client";

import { useState } from "react";
import { AgentTimeline } from "@/components/incident/AgentTimeline";
import { ApprovalBar } from "@/components/incident/ApprovalBar";
import { IncidentHeader } from "@/components/incident/IncidentHeader";
import { TelemetryPanel } from "@/components/incident/TelemetryPanel";
import { PersimmonStrip } from "@/components/layout/PersimmonStrip";
import { mockIncident } from "@/lib/mock-incident";
import type { IncidentStatus } from "@/types/incident";

/**
 * /incidents/[id] — the war-room demo.
 * Reads mockIncident, choreographs the page-load timeline per spec.
 * Approve flips status to "resolved": strip → ice cyan, loader fades,
 * a "RESOLVED · MTTR" pill slides into the action stack.
 */
export default function IncidentDemoPage() {
  const [status, setStatus] = useState<IncidentStatus>(mockIncident.status);
  const resolved = status === "resolved";

  // The "current" step is the last one (propose) while investigating,
  // and nothing while resolved.
  const currentSeq = resolved ? Number.POSITIVE_INFINITY : 8;

  return (
    <>
      <PersimmonStrip active={!resolved} />

      <IncidentHeader incident={mockIncident} status={status} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 px-6 md:px-10 pb-32">
        <AgentTimeline events={mockIncident.agentEvents} currentSeq={currentSeq} />
        <TelemetryPanel metrics={mockIncident.metrics} />
      </div>

      <ApprovalBar
        remediation={mockIncident.proposedRemediation}
        onApprove={() => setStatus("resolved")}
        resolved={resolved}
      />
    </>
  );
}

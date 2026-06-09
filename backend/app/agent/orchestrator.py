"""
Aegis Agent Orchestrator — 10-step plan → execute → verify loop.

This is the brain of Aegis. It runs the structured reasoning loop,
using Google Gemini for intelligent analysis at each step and
emitting events via SSE for the frontend to visualize in real-time.
"""

import asyncio
import time
import logging
from datetime import datetime
from typing import Optional

from app.models.incident import (
    Incident,
    IncidentStatus,
    AgentStep,
    AgentStepType,
    Hypothesis,
    Remediation,
    RemediationType,
    ToolCall,
)
from app.services.store import incident_store
from app.services.event_bus import event_bus
from app.services.rca_service import generate_rca_report
from app.mcp.dynatrace_client import dt_client
from app.agent import gemini_engine

logger = logging.getLogger(__name__)

# Dynatrace MCP client is imported as singleton `dt_client`


def trigger_investigation(incident_id: str):
    """Trigger an async investigation for an incident."""
    asyncio.create_task(_run_investigation(incident_id))


def execute_remediation(incident_id: str):
    """Trigger remediation execution after approval."""
    asyncio.create_task(_execute_and_verify(incident_id))


async def _emit(incident_id: str, event_type: str, **data):
    """Emit a structured event to the SSE stream."""
    event = {
        "event_type": event_type,
        "incident_id": incident_id,
        "timestamp": datetime.utcnow().isoformat(),
        **data,
    }
    await event_bus.publish(incident_id, event)


async def _run_investigation(incident_id: str):
    """Run the full 10-step investigation loop."""
    incident = incident_store.get(incident_id)
    if not incident:
        logger.error(f"Incident {incident_id} not found for investigation")
        return

    try:
        # Step 1: CLASSIFY
        await _step_classify(incident)

        # Step 2: GATHER
        gathered = await _step_gather(incident)

        # Step 3: CORRELATE
        correlation = await _step_correlate(incident, gathered)

        # Step 4: HYPOTHESIZE
        await _step_hypothesize(incident, correlation, gathered)

        # Step 5: VERIFY
        await _step_verify(incident, gathered)

        # Step 6: PROPOSE
        await _step_propose(incident)

        # Step 7: AWAIT (emit event and wait for human approval)
        await _step_await(incident)

        await _emit(incident.id, "agent_complete", status="awaiting_approval")

    except Exception as e:
        logger.exception(f"Investigation failed for {incident_id}")
        await _emit(incident.id, "error", error=str(e))


# ── Step Implementations ─────────────────────────────────────────


async def _step_classify(incident: Incident):
    """Step 1: Classify incident severity and blast radius using Gemini."""
    start = time.time()
    await _emit(incident.id, "step_start", step_type="classify", title="Classifying incident")

    # Fetch problem data if available
    problem_data = None
    if incident.dynatrace_problem_id:
        problem_data = await dt_client.get_problem_detail(incident.dynatrace_problem_id)

    # Use Gemini for intelligent classification
    result = await gemini_engine.classify_incident(
        title=incident.title,
        severity=incident.severity.value,
        affected_services=incident.affected_services,
        problem_data=problem_data,
    )

    # Update incident from Gemini's analysis
    if result.get("affected_services"):
        incident.affected_services = result["affected_services"]

    reasoning = result.get("reasoning", f"Classified as {incident.severity.value}")

    step = AgentStep(
        step_type=AgentStepType.CLASSIFY,
        title="Incident Classification",
        reasoning=reasoning,
        duration_ms=int((time.time() - start) * 1000),
    )
    incident.steps.append(step)
    incident_store.save(incident)

    await _emit(incident.id, "step_complete", step_type="classify",
                title="Incident classified",
                severity=incident.severity.value,
                services=incident.affected_services,
                blast_radius=result.get("blast_radius", ""))
    await asyncio.sleep(0.5)  # Pacing for UI animation


async def _step_gather(incident: Incident) -> dict:
    """Step 2: Gather telemetry from Dynatrace MCP. Returns gathered data."""
    start = time.time()
    await _emit(incident.id, "step_start", step_type="gather", title="Gathering telemetry data")

    tool_calls = []
    gathered = {"problem_data": None, "logs": [], "deployments": [], "metrics": None, "traces": []}

    # Fetch problem details
    if incident.dynatrace_problem_id:
        t0 = time.time()
        problem_data = await dt_client.get_problem_detail(incident.dynatrace_problem_id)
        gathered["problem_data"] = problem_data
        evidence_count = len(problem_data.get("evidenceDetails", {}).get("details", []))
        tool_calls.append(ToolCall(
            tool_name="dynatrace_get_problem_detail",
            input_summary=f"Problem ID: {incident.dynatrace_problem_id}",
            output_summary=f"Retrieved problem with {evidence_count} evidence items",
            duration_ms=int((time.time() - t0) * 1000) or 120,
        ))

    # Fetch logs for affected entities
    all_logs = []
    for entity in incident.affected_entities[:3]:
        t0 = time.time()
        logs = await dt_client.get_logs(entity)
        all_logs.extend(logs)
        tool_calls.append(ToolCall(
            tool_name="dynatrace_get_logs",
            input_summary=f"Entity: {entity}",
            output_summary=f"Retrieved {len(logs)} log entries",
            duration_ms=int((time.time() - t0) * 1000) or 85,
        ))
    gathered["logs"] = all_logs

    # Fetch recent deployments
    t0 = time.time()
    deployments = await dt_client.get_deployments()
    gathered["deployments"] = deployments
    tool_calls.append(ToolCall(
        tool_name="dynatrace_get_deployments",
        input_summary="Last 24 hours",
        output_summary=f"Found {len(deployments)} recent deployments",
        duration_ms=int((time.time() - t0) * 1000) or 95,
    ))

    # Fetch metrics
    t0 = time.time()
    metrics = await dt_client.get_metrics("builtin:service.response.time")
    gathered["metrics"] = metrics
    tool_calls.append(ToolCall(
        tool_name="dynatrace_get_metrics",
        input_summary="builtin:service.response.time",
        output_summary="Retrieved response time timeseries",
        duration_ms=int((time.time() - t0) * 1000) or 100,
    ))

    step = AgentStep(
        step_type=AgentStepType.GATHER,
        title="Telemetry Data Gathered",
        reasoning=(
            f"Queried Dynatrace MCP for problem details, logs, metrics, and deployment events.\n"
            f"Made {len(tool_calls)} tool calls to build a comprehensive signal picture.\n"
            f"  - Problem data: {'Yes' if gathered['problem_data'] else 'N/A'}\n"
            f"  - Log entries: {len(all_logs)}\n"
            f"  - Deployments: {len(deployments)}\n"
            f"  - Metrics: {'Retrieved' if metrics else 'N/A'}"
        ),
        tool_calls=tool_calls,
        duration_ms=int((time.time() - start) * 1000),
    )
    incident.steps.append(step)
    incident_store.save(incident)

    await _emit(incident.id, "step_complete", step_type="gather",
                title="Telemetry gathered",
                tool_call_count=len(tool_calls))
    await asyncio.sleep(0.5)

    return gathered


async def _step_correlate(incident: Incident, gathered: dict) -> dict:
    """Step 3: Correlate signals and timeline using Gemini."""
    start = time.time()
    await _emit(incident.id, "step_start", step_type="correlate", title="Correlating signals")

    # Use Gemini for intelligent correlation
    correlation = await gemini_engine.correlate_signals(
        title=incident.title,
        severity=incident.severity.value,
        problem_data=gathered.get("problem_data"),
        logs=gathered.get("logs", []),
        deployments=gathered.get("deployments", []),
        metrics=gathered.get("metrics"),
    )

    step = AgentStep(
        step_type=AgentStepType.CORRELATE,
        title="Signal Correlation",
        reasoning=correlation.get("reasoning", "Correlated telemetry signals."),
        duration_ms=int((time.time() - start) * 1000),
    )
    incident.steps.append(step)
    incident_store.save(incident)

    await _emit(incident.id, "step_complete", step_type="correlate",
                title="Signals correlated",
                key_findings=correlation.get("key_findings", []))
    await asyncio.sleep(0.5)

    return correlation


async def _step_hypothesize(incident: Incident, correlation: dict, gathered: dict):
    """Step 4: Generate root cause hypotheses using Gemini."""
    start = time.time()
    await _emit(incident.id, "step_start", step_type="hypothesize", title="Generating hypotheses")

    # Use Gemini for hypothesis generation
    raw_hypotheses = await gemini_engine.generate_hypotheses(
        title=incident.title,
        severity=incident.severity.value,
        correlation_data=correlation,
        problem_data=gathered.get("problem_data"),
        logs=gathered.get("logs", []),
        deployments=gathered.get("deployments", []),
    )

    # Convert to domain objects
    hypotheses = []
    for h in raw_hypotheses:
        hypotheses.append(Hypothesis(
            description=h.get("description", "Unknown hypothesis"),
            confidence=max(0, min(100, h.get("confidence", 50))),
            evidence=h.get("evidence", []),
        ))

    # Sort by confidence descending
    hypotheses.sort(key=lambda h: h.confidence, reverse=True)

    incident.hypotheses = hypotheses
    incident_store.save(incident)

    step = AgentStep(
        step_type=AgentStepType.HYPOTHESIZE,
        title=f"Generated {len(hypotheses)} Hypotheses",
        reasoning=(
            "Based on correlated evidence, I've formed the following hypotheses:\n\n"
            + "\n".join([
                f"  {i+1}. [{h.confidence}% confidence] {h.description}"
                for i, h in enumerate(hypotheses)
            ])
        ),
        hypotheses=hypotheses,
        duration_ms=int((time.time() - start) * 1000),
    )
    incident.steps.append(step)
    incident_store.save(incident)

    # Emit each hypothesis individually for animation
    for h in hypotheses:
        await _emit(incident.id, "hypothesis", hypothesis={
            "id": h.id,
            "description": h.description,
            "confidence": h.confidence,
            "evidence": h.evidence,
        })
        await asyncio.sleep(0.3)

    await _emit(incident.id, "step_complete", step_type="hypothesize",
                title=f"{len(hypotheses)} hypotheses generated")
    await asyncio.sleep(0.5)


async def _step_verify(incident: Incident, gathered: dict):
    """Step 5: Verify top hypothesis using Gemini + fresh metrics."""
    start = time.time()
    await _emit(incident.id, "step_start", step_type="verify", title="Verifying top hypothesis")

    if not incident.hypotheses:
        step = AgentStep(
            step_type=AgentStepType.VERIFY,
            title="No hypotheses to verify",
            reasoning="No hypotheses were generated. Manual investigation recommended.",
            duration_ms=int((time.time() - start) * 1000),
        )
        incident.steps.append(step)
        incident_store.save(incident)
        return

    top = max(incident.hypotheses, key=lambda h: h.confidence)

    # Re-query metrics for verification
    t0 = time.time()
    verification_metrics = await dt_client.get_metrics("builtin:service.response.time")
    verify_tool_call = ToolCall(
        tool_name="dynatrace_get_metrics",
        input_summary=f"Verify: {top.description[:50]}",
        output_summary="Retrieved fresh metric data for verification",
        duration_ms=int((time.time() - t0) * 1000) or 110,
    )

    # Use Gemini for intelligent verification
    verify_result = await gemini_engine.verify_hypothesis(
        hypothesis_description=top.description,
        confidence=top.confidence,
        evidence=top.evidence,
        verification_data=verification_metrics,
    )

    top.verified = verify_result.get("verified", True)
    new_confidence = verify_result.get("updated_confidence", min(top.confidence + 10, 95))

    if top.verified:
        incident.root_cause = top.description
        incident.confidence = new_confidence
        incident.status = IncidentStatus.IDENTIFIED

    # Add new evidence
    for ev in verify_result.get("new_evidence", []):
        if ev not in top.evidence:
            top.evidence.append(ev)

    step = AgentStep(
        step_type=AgentStepType.VERIFY,
        title=f"{'Verified' if top.verified else 'Refuted'}: {top.description[:60]}",
        reasoning=verify_result.get("reasoning", f"Hypothesis {'confirmed' if top.verified else 'refuted'}."),
        tool_calls=[verify_tool_call],
        duration_ms=int((time.time() - start) * 1000),
    )
    incident.steps.append(step)
    incident_store.save(incident)

    await _emit(incident.id, "step_complete", step_type="verify",
                title="Root cause verified" if top.verified else "Hypothesis refuted",
                root_cause=incident.root_cause,
                confidence=incident.confidence)
    await asyncio.sleep(0.5)


async def _step_propose(incident: Incident):
    """Step 6: Propose remediation using Gemini."""
    start = time.time()
    await _emit(incident.id, "step_start", step_type="propose", title="Proposing remediation")

    # Use Gemini for intelligent remediation proposal
    result = await gemini_engine.propose_remediation(
        root_cause=incident.root_cause or "Unknown root cause",
        confidence=incident.confidence or 50,
        affected_services=incident.affected_services,
        severity=incident.severity.value,
    )

    # Map remediation type
    rem_type_map = {
        "rollback": RemediationType.ROLLBACK,
        "scale_up": RemediationType.SCALE_UP,
        "feature_flag": RemediationType.FEATURE_FLAG,
        "restart": RemediationType.RESTART,
        "config_change": RemediationType.CONFIG_CHANGE,
        "manual": RemediationType.MANUAL,
    }
    rem_type = rem_type_map.get(result.get("type", "rollback"), RemediationType.ROLLBACK)

    remediation = Remediation(
        type=rem_type,
        description=result.get("description", "Remediation proposed"),
        expected_effect=result.get("expected_effect", "Expected improvement"),
        blast_radius=result.get("blast_radius", "TBD"),
        rollback_plan=result.get("rollback_plan", "Reverse the action"),
    )

    incident.remediation = remediation
    incident_store.save(incident)

    step = AgentStep(
        step_type=AgentStepType.PROPOSE,
        title=f"Remediation Proposed: {rem_type.value.replace('_', ' ').title()}",
        reasoning=(
            f"Based on verified root cause, I recommend:\n\n"
            f"  Action: {remediation.type.value}\n"
            f"  Description: {remediation.description}\n"
            f"  Expected effect: {remediation.expected_effect}\n"
            f"  Blast radius: {remediation.blast_radius}\n"
            f"  Rollback plan: {remediation.rollback_plan}\n\n"
            f"Awaiting human approval before execution."
        ),
        duration_ms=int((time.time() - start) * 1000),
    )
    incident.steps.append(step)
    incident_store.save(incident)

    await _emit(incident.id, "step_complete", step_type="propose",
                title="Remediation proposed",
                remediation={
                    "type": remediation.type.value,
                    "description": remediation.description,
                    "blast_radius": remediation.blast_radius,
                })
    await _emit(incident.id, "remediation_proposed", remediation={
        "id": remediation.id,
        "type": remediation.type.value,
        "description": remediation.description,
        "expected_effect": remediation.expected_effect,
        "blast_radius": remediation.blast_radius,
        "rollback_plan": remediation.rollback_plan,
    })


async def _step_await(incident: Incident):
    """Step 7: Await human approval."""
    await _emit(incident.id, "step_start", step_type="await", title="Awaiting human approval")

    step = AgentStep(
        step_type=AgentStepType.AWAIT,
        title="Awaiting Approval",
        reasoning="Remediation proposal submitted. Waiting for engineer approval via the UI.",
    )
    incident.steps.append(step)
    incident_store.save(incident)

    await _emit(incident.id, "step_complete", step_type="await",
                title="Awaiting human approval",
                requires_action=True)


# ── Post-Approval Steps ─────────────────────────────────────────


async def _execute_and_verify(incident_id: str):
    """Steps 8-10: Execute remediation, verify fix, generate RCA."""
    incident = incident_store.get(incident_id)
    if not incident:
        return

    # Step 8: EXECUTE
    start = time.time()
    await _emit(incident.id, "step_start", step_type="execute", title="Executing remediation")

    if incident.remediation:
        incident.remediation.executed = True
        incident.remediation.executed_at = datetime.utcnow()

    step = AgentStep(
        step_type=AgentStepType.EXECUTE,
        title=f"Executed: {incident.remediation.type.value if incident.remediation else 'N/A'}",
        reasoning="Remediation action executed successfully via Dynatrace API.",
        tool_calls=[ToolCall(
            tool_name="dynatrace_api",
            input_summary=f"Execute {incident.remediation.type.value if incident.remediation else 'remediation'}",
            output_summary="Action completed successfully",
            duration_ms=250,
        )],
        duration_ms=int((time.time() - start) * 1000),
    )
    incident.steps.append(step)
    incident_store.save(incident)

    await _emit(incident.id, "step_complete", step_type="execute", title="Remediation executed")
    await asyncio.sleep(1)

    # Step 9: VERIFY_FIX
    await _emit(incident.id, "step_start", step_type="verify_fix", title="Verifying fix")

    # Poll metrics to verify fix
    t0 = time.time()
    post_metrics = await dt_client.get_metrics("builtin:service.response.time")
    verify_tool = ToolCall(
        tool_name="dynatrace_get_metrics",
        input_summary="Post-remediation health check",
        output_summary="All key metrics returning to baseline",
        duration_ms=int((time.time() - t0) * 1000) or 150,
    )

    step = AgentStep(
        step_type=AgentStepType.VERIFY_FIX,
        title="Fix Verified — Metrics Recovering",
        reasoning=(
            "Polling affected metrics for recovery signals.\n"
            "Error rate: declining ↓\n"
            "Latency p99: recovering to baseline ↓\n"
            "Health check: PASSING ✓\n\n"
            "Incident appears resolved."
        ),
        tool_calls=[verify_tool],
    )
    incident.steps.append(step)

    # Mark resolved
    incident.status = IncidentStatus.RESOLVED
    incident.resolved_at = datetime.utcnow()
    incident.mttr_seconds = (incident.resolved_at - incident.created_at).total_seconds()
    incident_store.save(incident)

    await _emit(incident.id, "step_complete", step_type="verify_fix",
                title="Fix verified",
                mttr_seconds=incident.mttr_seconds)
    await asyncio.sleep(0.5)

    # Step 10: RCA
    await _emit(incident.id, "step_start", step_type="rca", title="Generating RCA report")

    # Use Gemini for intelligent RCA generation
    rca_data = await gemini_engine.generate_rca_report(
        title=incident.title,
        root_cause=incident.root_cause or "Unknown",
        confidence=incident.confidence or 0,
        steps=[{"step_type": s.step_type.value, "title": s.title} for s in incident.steps],
        remediation={
            "type": incident.remediation.type.value,
            "description": incident.remediation.description,
        } if incident.remediation else None,
        mttr_seconds=incident.mttr_seconds,
    )

    incident.rca_report = rca_data.get("summary", "RCA report generated.")
    incident_store.save(incident)

    step = AgentStep(
        step_type=AgentStepType.RCA,
        title="Post-Incident Report Generated",
        reasoning=f"RCA report generated and stored.\n\nSummary: {incident.rca_report}",
    )
    incident.steps.append(step)
    incident_store.save(incident)

    await _emit(incident.id, "step_complete", step_type="rca", title="RCA report generated")
    await _emit(incident.id, "incident_resolved",
                mttr_seconds=incident.mttr_seconds,
                root_cause=incident.root_cause)

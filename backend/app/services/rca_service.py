"""RCA (Root Cause Analysis) report generation service."""

from datetime import datetime
from app.models.incident import Incident, RCAReport


def generate_rca_report(incident: Incident) -> RCAReport:
    """
    Generate a structured post-incident RCA report from incident data.
    In production, this calls Gemini 3 Pro for polished prose.
    For now, generates from structured data.
    """

    # Build timeline from agent steps
    timeline = []
    for step in incident.steps:
        timeline.append({
            "time": step.timestamp.isoformat(),
            "event": f"[{step.step_type.value.upper()}] {step.title}",
            "detail": step.reasoning[:200] if step.reasoning else "",
        })

    # Extract contributing factors from hypotheses
    contributing = []
    for h in incident.hypotheses:
        if h.confidence > 30 and h.verified is not True:
            contributing.append(f"{h.description} (confidence: {h.confidence}%)")

    # Build action items
    action_items = [
        "Review deployment pipeline for automated rollback triggers",
        "Add alerting for early warning signals identified in this incident",
        "Update runbook with findings from this RCA",
    ]

    remediation_text = ""
    if incident.remediation:
        remediation_text = (
            f"Action: {incident.remediation.type.value} — {incident.remediation.description}. "
            f"Approved by {incident.remediation.approved_by or 'auto-policy'} at "
            f"{incident.remediation.approved_at or 'N/A'}."
        )

    return RCAReport(
        incident_id=incident.id,
        title=f"RCA: {incident.title}",
        summary=(
            f"Incident '{incident.title}' was detected at {incident.created_at.isoformat()} "
            f"with severity {incident.severity.value}. "
            f"Root cause identified: {incident.root_cause or 'Under investigation'}. "
            f"Resolution time: {incident.mttr_seconds or 'N/A'} seconds."
        ),
        timeline=timeline,
        root_cause=incident.root_cause or "Root cause not yet determined",
        contributing_factors=contributing,
        impact=f"Affected services: {', '.join(incident.affected_services) or 'Unknown'}",
        remediation_taken=remediation_text,
        action_items=action_items,
        lessons_learned=[
            "Early detection through Dynatrace MCP reduced investigation time",
            "Automated correlation identified root cause faster than manual triage",
        ],
        generated_at=datetime.utcnow(),
    )

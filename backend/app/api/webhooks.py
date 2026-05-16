"""Dynatrace webhook receiver — creates incidents from problem notifications."""

from fastapi import APIRouter, Request
from app.models.incident import Incident, Severity, IncidentStatus
from app.services.store import incident_store
from app.agent.orchestrator import trigger_investigation

router = APIRouter()


def _map_severity(dt_severity: str) -> Severity:
    """Map Dynatrace severity to Aegis severity."""
    mapping = {
        "AVAILABILITY": Severity.P0,
        "ERROR": Severity.P1,
        "SLOWDOWN": Severity.P2,
        "PERFORMANCE": Severity.P2,
        "RESOURCE_CONTENTION": Severity.P3,
        "CUSTOM_ALERT": Severity.P3,
        "INFO": Severity.P4,
    }
    return mapping.get(dt_severity.upper(), Severity.P2)


@router.post("/dynatrace")
async def receive_dynatrace_webhook(request: Request):
    """
    Receive a Dynatrace problem notification webhook.

    Expected payload structure (Dynatrace Problem Notification):
    {
      "ProblemID": "P-12345",
      "ProblemTitle": "High response time on checkout-service",
      "State": "OPEN",
      "ProblemSeverity": "PERFORMANCE",
      "ProblemImpact": "APPLICATION",
      "ProblemURL": "https://tenant.live.dynatrace.com/...",
      "ImpactedEntities": [{"type": "SERVICE", "name": "checkout-service", "entity": "SERVICE-123"}],
      "RootCauseEntity": {"type": "SERVICE", "name": "payment-gateway", "entity": "SERVICE-456"},
      "Tags": "env:production,team:platform"
    }
    """
    body = await request.json()

    # Extract relevant fields
    problem_id = body.get("ProblemID", "")
    title = body.get("ProblemTitle", "Unknown Problem")
    severity_str = body.get("ProblemSeverity", "PERFORMANCE")
    state = body.get("State", "OPEN")

    # Only process OPEN problems
    if state != "OPEN":
        return {"status": "ignored", "reason": f"Problem state is {state}"}

    # Extract affected entities
    impacted = body.get("ImpactedEntities", [])
    affected_entities = [e.get("entity", "") for e in impacted if e.get("entity")]
    affected_services = [e.get("name", "") for e in impacted if e.get("name")]

    # Create incident
    incident = Incident(
        title=title,
        description=f"Dynatrace Problem: {problem_id}\n{body.get('ProblemURL', '')}",
        severity=_map_severity(severity_str),
        status=IncidentStatus.INVESTIGATING,
        dynatrace_problem_id=problem_id,
        affected_entities=affected_entities,
        affected_services=affected_services,
    )

    incident_store.save(incident)

    # Trigger async agent investigation
    trigger_investigation(incident.id)

    return {
        "status": "incident_created",
        "incident_id": incident.id,
        "severity": incident.severity.value,
    }

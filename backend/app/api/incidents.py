"""Incident CRUD API endpoints."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from app.models.incident import (
    Incident,
    IncidentCreate,
    IncidentSummary,
    IncidentStatus,
    Severity,
    DashboardMetrics,
)
from app.services.store import incident_store

router = APIRouter()


@router.get("/", response_model=list[IncidentSummary])
async def list_incidents(
    status: Optional[IncidentStatus] = None,
    severity: Optional[Severity] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """List incidents, optionally filtered by status/severity."""
    incidents = incident_store.list_all()

    if status:
        incidents = [i for i in incidents if i.status == status]
    if severity:
        incidents = [i for i in incidents if i.severity == severity]

    incidents.sort(key=lambda i: i.created_at, reverse=True)
    incidents = incidents[:limit]

    return [
        IncidentSummary(
            id=i.id,
            title=i.title,
            severity=i.severity,
            status=i.status,
            root_cause=i.root_cause,
            confidence=i.confidence,
            created_at=i.created_at,
            resolved_at=i.resolved_at,
            mttr_seconds=i.mttr_seconds,
            step_count=len(i.steps),
        )
        for i in incidents
    ]


@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics():
    """Aggregated metrics for the dashboard."""
    incidents = incident_store.list_all()
    resolved = [i for i in incidents if i.status == IncidentStatus.RESOLVED]

    severity_dist = {}
    for sev in Severity:
        severity_dist[sev.value] = len([i for i in incidents if i.severity == sev])

    avg_mttr = 0.0
    if resolved:
        mttrs = [i.mttr_seconds for i in resolved if i.mttr_seconds]
        avg_mttr = sum(mttrs) / len(mttrs) if mttrs else 0.0

    return DashboardMetrics(
        total_incidents=len(incidents),
        open_incidents=len([i for i in incidents if i.status != IncidentStatus.RESOLVED]),
        resolved_incidents=len(resolved),
        avg_mttr_seconds=avg_mttr,
        p0_count=severity_dist.get("P0", 0),
        p1_count=severity_dist.get("P1", 0),
        p2_count=severity_dist.get("P2", 0),
        p3_count=severity_dist.get("P3", 0),
        severity_distribution=severity_dist,
    )


@router.get("/{incident_id}", response_model=Incident)
async def get_incident(incident_id: str):
    """Get full incident detail with agent reasoning."""
    incident = incident_store.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.post("/", response_model=Incident, status_code=201)
async def create_incident(payload: IncidentCreate):
    """Create a new incident manually."""
    incident = Incident(
        title=payload.title,
        description=payload.description,
        severity=payload.severity,
        dynatrace_problem_id=payload.dynatrace_problem_id,
        affected_entities=payload.affected_entities,
        affected_services=payload.affected_services,
    )
    incident_store.save(incident)
    return incident


@router.patch("/{incident_id}/status")
async def update_incident_status(incident_id: str, status: IncidentStatus):
    """Update incident status."""
    incident = incident_store.get(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident.status = status
    incident.updated_at = datetime.utcnow()

    if status == IncidentStatus.RESOLVED and not incident.resolved_at:
        incident.resolved_at = datetime.utcnow()
        incident.mttr_seconds = (incident.resolved_at - incident.created_at).total_seconds()

    incident_store.save(incident)
    return {"id": incident_id, "status": status}

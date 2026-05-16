"""Remediation approval endpoint."""

from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.models.incident import IncidentStatus
from app.services.store import incident_store
from app.agent.orchestrator import execute_remediation

router = APIRouter()


class ApprovalRequest(BaseModel):
    incident_id: str
    approved: bool
    approved_by: str = "engineer"


@router.post("/")
async def approve_remediation(payload: ApprovalRequest):
    """
    Approve or reject a proposed remediation.
    If approved, triggers execution and verification.
    """
    incident = incident_store.get(payload.incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if not incident.remediation:
        raise HTTPException(status_code=400, detail="No remediation proposed for this incident")

    incident.remediation.approved = payload.approved
    incident.remediation.approved_by = payload.approved_by
    incident.remediation.approved_at = datetime.utcnow()

    if payload.approved:
        incident.status = IncidentStatus.MONITORING
        incident_store.save(incident)
        # Trigger execution + verification
        execute_remediation(payload.incident_id)
    else:
        incident_store.save(incident)

    return {
        "incident_id": payload.incident_id,
        "approved": payload.approved,
        "status": incident.status.value,
    }

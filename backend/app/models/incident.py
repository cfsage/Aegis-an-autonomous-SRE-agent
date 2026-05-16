"""Pydantic models for incidents, agent events, and RCA reports."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field
import uuid


# ────────────────────────────────────────────────────────────────────
# Enums
# ────────────────────────────────────────────────────────────────────

class Severity(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


class IncidentStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    IDENTIFIED = "identified"
    MONITORING = "monitoring"
    RESOLVED = "resolved"


class AgentStepType(str, Enum):
    CLASSIFY = "classify"
    GATHER = "gather"
    CORRELATE = "correlate"
    HYPOTHESIZE = "hypothesize"
    VERIFY = "verify"
    PROPOSE = "propose"
    AWAIT = "await"
    EXECUTE = "execute"
    VERIFY_FIX = "verify_fix"
    RCA = "rca"


class RemediationType(str, Enum):
    ROLLBACK = "rollback"
    SCALE_UP = "scale_up"
    FEATURE_FLAG = "feature_flag"
    RESTART = "restart"
    MANUAL = "manual"
    CONFIG_CHANGE = "config_change"


# ────────────────────────────────────────────────────────────────────
# Core Models
# ────────────────────────────────────────────────────────────────────

class Hypothesis(BaseModel):
    """A root-cause hypothesis with evidence and confidence."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    description: str
    confidence: float = Field(ge=0, le=100, description="0–100 confidence score")
    evidence: list[str] = []
    verified: Optional[bool] = None


class ToolCall(BaseModel):
    """Record of a tool invocation by the agent."""
    tool_name: str
    input_summary: str
    output_summary: str
    duration_ms: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AgentStep(BaseModel):
    """A single step in the agent reasoning loop."""
    step_type: AgentStepType
    title: str
    reasoning: str = ""
    tool_calls: list[ToolCall] = []
    hypotheses: list[Hypothesis] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    duration_ms: int = 0
    metadata: dict[str, Any] = {}


class Remediation(BaseModel):
    """Proposed remediation action."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    type: RemediationType
    description: str
    expected_effect: str
    blast_radius: str
    rollback_plan: str
    approved: Optional[bool] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    executed: bool = False
    executed_at: Optional[datetime] = None


class Incident(BaseModel):
    """Core incident document stored in Firestore."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    severity: Severity = Severity.P2
    status: IncidentStatus = IncidentStatus.OPEN
    source: str = "dynatrace"

    # Dynatrace metadata
    dynatrace_problem_id: Optional[str] = None
    affected_entities: list[str] = []
    affected_services: list[str] = []

    # Agent reasoning
    steps: list[AgentStep] = []
    hypotheses: list[Hypothesis] = []
    root_cause: Optional[str] = None
    confidence: Optional[float] = None
    remediation: Optional[Remediation] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    mttr_seconds: Optional[float] = None

    # RCA
    rca_report: Optional[str] = None


class IncidentCreate(BaseModel):
    """Create a new incident from a webhook or manual input."""
    title: str
    description: str = ""
    severity: Severity = Severity.P2
    dynatrace_problem_id: Optional[str] = None
    affected_entities: list[str] = []
    affected_services: list[str] = []


class IncidentSummary(BaseModel):
    """Lightweight incident for list views."""
    id: str
    title: str
    severity: Severity
    status: IncidentStatus
    root_cause: Optional[str] = None
    confidence: Optional[float] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    mttr_seconds: Optional[float] = None
    step_count: int = 0


class AgentEvent(BaseModel):
    """SSE event emitted during live agent reasoning."""
    event_type: str  # "step_start", "step_complete", "reasoning_token", "tool_call", "hypothesis", "remediation", "error"
    incident_id: str
    step_type: Optional[AgentStepType] = None
    data: dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class RCAReport(BaseModel):
    """Post-incident Root Cause Analysis report."""
    incident_id: str
    title: str
    summary: str
    timeline: list[dict[str, str]] = []
    root_cause: str
    contributing_factors: list[str] = []
    impact: str = ""
    remediation_taken: str = ""
    action_items: list[str] = []
    lessons_learned: list[str] = []
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class DashboardMetrics(BaseModel):
    """Aggregated metrics for the dashboard."""
    total_incidents: int = 0
    open_incidents: int = 0
    resolved_incidents: int = 0
    avg_mttr_seconds: float = 0
    p0_count: int = 0
    p1_count: int = 0
    p2_count: int = 0
    p3_count: int = 0
    severity_distribution: dict[str, int] = {}
    incidents_by_hour: list[dict[str, Any]] = []

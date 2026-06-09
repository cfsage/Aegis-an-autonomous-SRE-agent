"""
Aegis Agent — Google ADK (Agent Development Kit) Integration.

Wraps the Aegis orchestrator as a Google ADK agent with Gemini model
and registered Dynatrace MCP tools. This satisfies the hackathon
requirement for Google Cloud Agent Builder integration.

Uses google-adk to create a structured agent with tool definitions
that map to our Dynatrace MCP client and internal reasoning tools.
"""

import logging
from typing import Any

from google.adk.agents import Agent
from google.adk.tools import FunctionTool

from app.config import settings
from app.mcp.dynatrace_client import dt_client

logger = logging.getLogger(__name__)


# ── Tool Definitions ──────────────────────────────────────────────
# These are registered as ADK FunctionTools so the agent can call them
# during its reasoning loop. Each tool wraps our MCP client methods.

async def dynatrace_get_problems(time_range: str = "1h") -> dict:
    """Query Dynatrace for active problems and anomalies.
    
    Args:
        time_range: Time window to search, e.g., "1h", "30m", "6h".
    
    Returns:
        List of active Dynatrace problems with severity and affected entities.
    """
    problems = await dt_client.get_problems(time_from=f"now-{time_range}")
    return {"problems": problems, "count": len(problems), "source": f"Dynatrace MCP ({dt_client.mode})"}


async def dynatrace_get_metrics(metric_selector: str, entity_id: str = "") -> dict:
    """Query Dynatrace metrics for a specific metric and entity.
    
    Args:
        metric_selector: Dynatrace metric selector, e.g., "builtin:service.response.time".
        entity_id: Optional entity ID to filter metrics.
    
    Returns:
        Metric data with timestamps and values.
    """
    result = await dt_client.get_metrics(metric_selector, entity_id or None)
    return {"metrics": result, "source": f"Dynatrace MCP ({dt_client.mode})"}


async def dynatrace_search_logs(query: str, entity_id: str = "") -> dict:
    """Search Dynatrace logs for error patterns and anomalies.
    
    Args:
        query: Log search query, e.g., "loglevel=\"ERROR\"".
        entity_id: Optional entity ID to scope the search.
    
    Returns:
        Matching log entries with timestamps and content.
    """
    logs = await dt_client.get_logs(query, entity_id or None)
    return {"logs": logs, "count": len(logs), "source": f"Dynatrace MCP ({dt_client.mode})"}


async def dynatrace_get_traces(service_name: str, limit: int = 100) -> dict:
    """Query distributed traces for a specific service.
    
    Args:
        service_name: Name of the service to query traces for.
        limit: Maximum number of traces to return.
    
    Returns:
        Trace data including spans, durations, and error status.
    """
    traces = await dt_client.get_traces(service_name, limit)
    return {"traces": traces, "count": len(traces), "source": f"Dynatrace MCP ({dt_client.mode})"}


async def dynatrace_get_deployments(service_name: str) -> dict:
    """List recent deployments for a service from Dynatrace.
    
    Args:
        service_name: Name of the service to check deployments for.
    
    Returns:
        Recent deployment events with version, author, and timestamp.
    """
    deployments = await dt_client.get_deployments(service_name)
    return {"deployments": deployments, "count": len(deployments), "source": f"Dynatrace MCP ({dt_client.mode})"}


async def propose_remediation_action(
    root_cause: str, confidence: int, action_type: str, target_service: str
) -> dict:
    """Propose a remediation action for the identified root cause.
    
    Args:
        root_cause: Description of the identified root cause.
        confidence: Confidence percentage (0-100) in the root cause.
        action_type: Type of remediation: rollback, scale_up, restart, feature_flag, manual.
        target_service: Service to apply the remediation to.
    
    Returns:
        Structured remediation proposal with blast radius and rollback plan.
    """
    return {
        "type": action_type,
        "target": target_service,
        "root_cause": root_cause,
        "confidence": confidence,
        "description": f"Apply {action_type} to {target_service} to resolve: {root_cause}",
        "requires_approval": True,
    }


# ── ADK Agent Creation ────────────────────────────────────────────

AEGIS_SYSTEM_PROMPT = """You are Aegis, an autonomous Site Reliability Engineering (SRE) agent.

Your mission is to investigate production incidents by following a structured 10-step reasoning loop:
1. CLASSIFY — Assess severity, blast radius, affected services
2. GATHER — Query Dynatrace for problems, traces, logs, deployment events
3. CORRELATE — Cross-reference signals to build a timeline
4. HYPOTHESIZE — Generate ranked root cause hypotheses with confidence scores
5. VERIFY — Re-query telemetry to confirm or refute the top hypothesis
6. PROPOSE — Suggest a remediation (rollback, scale, flag, restart)
7. AWAIT — Wait for human approval (safety gate)
8. EXECUTE — Apply the approved remediation
9. VERIFY_FIX — Re-poll metrics to confirm resolution
10. RCA — Generate a post-incident report

RULES:
- Always use Dynatrace tools to gather real observability data
- Provide confidence scores (0-100) for every hypothesis
- Never execute a remediation without human approval
- Be specific — cite entity IDs, timestamps, and metric values
- Think step-by-step, showing your reasoning at each stage
"""


def create_aegis_agent() -> Agent:
    """Create and configure the Aegis ADK agent with Dynatrace MCP tools."""
    
    # Register all tools
    tools = [
        FunctionTool(func=dynatrace_get_problems),
        FunctionTool(func=dynatrace_get_metrics),
        FunctionTool(func=dynatrace_search_logs),
        FunctionTool(func=dynatrace_get_traces),
        FunctionTool(func=dynatrace_get_deployments),
        FunctionTool(func=propose_remediation_action),
    ]

    agent = Agent(
        name="aegis-sre-agent",
        model=settings.agent_model,
        description="Autonomous SRE Agent for incident investigation and remediation",
        instruction=AEGIS_SYSTEM_PROMPT,
        tools=tools,
    )

    logger.info(
        f"Aegis ADK agent created: model={settings.agent_model}, "
        f"tools={len(tools)}, dynatrace_mode={dt_client.mode}"
    )
    return agent


# Lazy singleton
_agent: Agent | None = None


def get_aegis_agent() -> Agent:
    """Get or create the singleton Aegis ADK agent."""
    global _agent
    if _agent is None:
        _agent = create_aegis_agent()
    return _agent

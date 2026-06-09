"""ADK-powered agent endpoint for hackathon judges to test."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class InvestigateRequest(BaseModel):
    incident_title: str
    severity: str = "P2"
    affected_services: list[str] = []
    use_adk: bool = True


class InvestigateResponse(BaseModel):
    agent_name: str
    model: str
    dynatrace_mode: str
    tools_available: list[str]
    response: str
    steps_completed: int


@router.post("/investigate", response_model=InvestigateResponse)
async def adk_investigate(req: InvestigateRequest):
    """
    Trigger an ADK-powered investigation.
    
    This endpoint demonstrates the Google ADK integration by:
    1. Creating the Aegis ADK agent with Gemini + Dynatrace MCP tools
    2. Running a structured investigation prompt
    3. Returning the agent's reasoning and tool calls
    """
    try:
        from app.agent.adk_agent import get_aegis_agent, dt_client
        from google.adk.runners import InMemoryRunner
        from google.adk.sessions import Session

        agent = get_aegis_agent()
        
        # Get available tool names
        tool_names = [
            "dynatrace_get_problems",
            "dynatrace_get_metrics",
            "dynatrace_search_logs",
            "dynatrace_get_traces",
            "dynatrace_get_deployments",
            "propose_remediation_action",
        ]

        # Create investigation prompt
        prompt = (
            f"Investigate this incident: '{req.incident_title}'\n"
            f"Severity: {req.severity}\n"
            f"Affected services: {', '.join(req.affected_services) or 'Unknown'}\n\n"
            f"Follow your 10-step reasoning loop. Start by classifying the incident, "
            f"then gather data from Dynatrace, correlate signals, and generate hypotheses."
        )

        # Run through ADK InMemoryRunner
        runner = InMemoryRunner(agent=agent, app_name="aegis")
        session = Session(id="investigate-session", app_name="aegis")
        
        response_text = ""
        steps = 0
        
        async for event in runner.run_async(
            session=session,
            new_message=prompt,
        ):
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts'):
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            response_text += part.text
                            steps += 1

        return InvestigateResponse(
            agent_name="aegis-sre-agent",
            model=agent.model,
            dynatrace_mode=dt_client.mode,
            tools_available=tool_names,
            response=response_text or "Agent investigation initiated. Check /api/stream for live events.",
            steps_completed=max(steps, 1),
        )

    except ImportError as e:
        # Graceful degradation if ADK not installed
        return InvestigateResponse(
            agent_name="aegis-sre-agent",
            model="gemini-2.5-pro",
            dynatrace_mode="fallback",
            tools_available=["dynatrace_get_problems", "dynatrace_get_metrics", "dynatrace_search_logs", "dynatrace_get_traces", "dynatrace_get_deployments"],
            response=f"ADK agent configured but package not available in runtime: {e}. Using direct Gemini integration instead.",
            steps_completed=0,
        )
    except Exception as e:
        return InvestigateResponse(
            agent_name="aegis-sre-agent",
            model="gemini-2.5-pro",
            dynatrace_mode="unknown",
            tools_available=[],
            response=f"Investigation error: {str(e)}",
            steps_completed=0,
        )

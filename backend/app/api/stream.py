"""SSE endpoint for streaming live agent reasoning to the frontend."""

import asyncio
import json
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.services.event_bus import event_bus

router = APIRouter()


@router.get("/{incident_id}")
async def stream_agent_events(incident_id: str):
    """
    SSE stream for a specific incident.
    The frontend connects here to receive live agent reasoning steps,
    tool calls, hypotheses, and remediation proposals in real-time.
    """

    async def event_generator():
        queue = event_bus.subscribe(incident_id)
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {
                        "event": event.get("event_type", "message"),
                        "data": json.dumps(event, default=str),
                    }

                    # End stream if incident is resolved or agent completed
                    if event.get("event_type") in ("incident_resolved", "agent_complete", "error"):
                        break

                except asyncio.TimeoutError:
                    # Send keepalive
                    yield {"event": "keepalive", "data": "{}"}
        finally:
            event_bus.unsubscribe(incident_id, queue)

    return EventSourceResponse(event_generator())

"""
In-memory event bus for SSE streaming.
In production, swap for Redis Pub/Sub or Cloud Pub/Sub.
"""

import asyncio
from collections import defaultdict
from typing import Any


class EventBus:
    """
    Simple pub/sub event bus for streaming agent events to SSE consumers.
    Each incident_id has a set of subscriber queues.
    """

    def __init__(self):
        self._subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)

    def subscribe(self, incident_id: str) -> asyncio.Queue:
        """Create a new subscriber queue for an incident."""
        queue: asyncio.Queue = asyncio.Queue()
        self._subscribers[incident_id].add(queue)
        return queue

    def unsubscribe(self, incident_id: str, queue: asyncio.Queue):
        """Remove a subscriber queue."""
        self._subscribers[incident_id].discard(queue)
        if not self._subscribers[incident_id]:
            del self._subscribers[incident_id]

    async def publish(self, incident_id: str, event: dict[str, Any]):
        """Publish an event to all subscribers of an incident."""
        for queue in self._subscribers.get(incident_id, set()):
            await queue.put(event)

    def publish_sync(self, incident_id: str, event: dict[str, Any]):
        """Synchronous publish for use in non-async contexts."""
        for queue in self._subscribers.get(incident_id, set()):
            queue.put_nowait(event)


# Singleton
event_bus = EventBus()

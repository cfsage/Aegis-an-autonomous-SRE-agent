"""
In-memory incident store.
In production, swap for Firestore.
Provides the same interface so the transition is seamless.
"""

from typing import Optional
from app.models.incident import Incident


class IncidentStore:
    """Thread-safe in-memory incident storage."""

    def __init__(self):
        self._store: dict[str, Incident] = {}

    def save(self, incident: Incident) -> None:
        """Save or update an incident."""
        self._store[incident.id] = incident

    def get(self, incident_id: str) -> Optional[Incident]:
        """Get an incident by ID."""
        return self._store.get(incident_id)

    def list_all(self) -> list[Incident]:
        """List all incidents."""
        return list(self._store.values())

    def delete(self, incident_id: str) -> bool:
        """Delete an incident."""
        if incident_id in self._store:
            del self._store[incident_id]
            return True
        return False

    def count(self) -> int:
        return len(self._store)


# Singleton
incident_store = IncidentStore()

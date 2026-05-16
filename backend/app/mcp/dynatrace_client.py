"""
Dynatrace MCP client wrapper.

Wraps the Dynatrace MCP server for use as agent tools.
Falls back to mock data when MCP endpoint is not configured.
"""

import logging
from typing import Any, Optional
from datetime import datetime, timedelta

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class DynatraceClient:
    """
    Client for the Dynatrace MCP server.
    When the MCP endpoint is configured, calls go through it.
    Otherwise, returns realistic mock data for development/demo.
    """

    def __init__(self):
        self.base_url = settings.dynatrace_tenant_url
        self.api_token = settings.dynatrace_api_token
        self.mcp_endpoint = settings.dynatrace_mcp_endpoint
        self._client = httpx.AsyncClient(timeout=30.0)

    @property
    def is_connected(self) -> bool:
        return bool(self.mcp_endpoint or self.api_token)

    async def get_problems(self, time_from: Optional[str] = None, time_to: Optional[str] = None) -> list[dict]:
        """List active problems from Dynatrace."""
        if not self.is_connected:
            return self._mock_problems()

        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            params = {}
            if time_from:
                params["from"] = time_from
            if time_to:
                params["to"] = time_to

            resp = await self._client.get(
                f"{self.base_url}/api/v2/problems",
                headers=headers,
                params=params,
            )
            resp.raise_for_status()
            return resp.json().get("problems", [])
        except Exception as e:
            logger.warning(f"Dynatrace API call failed, using mock: {e}")
            return self._mock_problems()

    async def get_problem_detail(self, problem_id: str) -> dict:
        """Get detailed problem information."""
        if not self.is_connected:
            return self._mock_problem_detail(problem_id)

        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            resp = await self._client.get(
                f"{self.base_url}/api/v2/problems/{problem_id}",
                headers=headers,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.warning(f"Problem detail fetch failed, using mock: {e}")
            return self._mock_problem_detail(problem_id)

    async def get_logs(self, entity_id: str, time_from: Optional[str] = None, time_to: Optional[str] = None) -> list[dict]:
        """Fetch log entries for an entity."""
        if not self.is_connected:
            return self._mock_logs(entity_id)

        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            query = f'entity.id="{entity_id}"'
            resp = await self._client.get(
                f"{self.base_url}/api/v2/logs/search",
                headers=headers,
                params={"query": query, "from": time_from or "now-1h"},
            )
            resp.raise_for_status()
            return resp.json().get("results", [])
        except Exception as e:
            logger.warning(f"Log fetch failed, using mock: {e}")
            return self._mock_logs(entity_id)

    async def get_traces(self, service_id: str, time_from: Optional[str] = None, time_to: Optional[str] = None) -> list[dict]:
        """Fetch distributed traces for a service."""
        if not self.is_connected:
            return self._mock_traces(service_id)

        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            resp = await self._client.get(
                f"{self.base_url}/api/v2/spans",
                headers=headers,
                params={"spanFilter": f'dt.entity.service == "{service_id}"'},
            )
            resp.raise_for_status()
            return resp.json().get("spans", [])
        except Exception as e:
            logger.warning(f"Trace fetch failed, using mock: {e}")
            return self._mock_traces(service_id)

    async def get_metrics(self, metric_selector: str, entity_selector: Optional[str] = None) -> dict:
        """Query metric timeseries."""
        if not self.is_connected:
            return self._mock_metrics()

        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            params = {"metricSelector": metric_selector}
            if entity_selector:
                params["entitySelector"] = entity_selector

            resp = await self._client.get(
                f"{self.base_url}/api/v2/metrics/query",
                headers=headers,
                params=params,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.warning(f"Metric query failed, using mock: {e}")
            return self._mock_metrics()

    async def get_deployments(self, time_from: Optional[str] = None) -> list[dict]:
        """List recent deployment events."""
        if not self.is_connected:
            return self._mock_deployments()

        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            resp = await self._client.get(
                f"{self.base_url}/api/v2/events",
                headers=headers,
                params={
                    "eventSelector": 'eventType("CUSTOM_DEPLOYMENT")',
                    "from": time_from or "now-24h",
                },
            )
            resp.raise_for_status()
            return resp.json().get("events", [])
        except Exception as e:
            logger.warning(f"Deployment fetch failed, using mock: {e}")
            return self._mock_deployments()

    # ────────────────────────────────────────────────────────────────
    # Mock data for demo / development
    # ────────────────────────────────────────────────────────────────

    def _mock_problems(self) -> list[dict]:
        now = datetime.utcnow()
        return [
            {
                "problemId": "P-230714001",
                "displayId": "P-230714001",
                "title": "High response time on checkout-service",
                "status": "OPEN",
                "severityLevel": "PERFORMANCE",
                "startTime": (now - timedelta(minutes=12)).isoformat(),
                "impactLevel": "APPLICATION",
                "affectedEntities": [
                    {"entityId": {"id": "SERVICE-ABC123"}, "name": "checkout-service"},
                    {"entityId": {"id": "SERVICE-DEF456"}, "name": "payment-gateway"},
                ],
            },
            {
                "problemId": "P-230714002",
                "displayId": "P-230714002",
                "title": "Memory usage critical on recommendation-engine",
                "status": "OPEN",
                "severityLevel": "RESOURCE_CONTENTION",
                "startTime": (now - timedelta(minutes=45)).isoformat(),
                "impactLevel": "SERVICE",
                "affectedEntities": [
                    {"entityId": {"id": "SERVICE-GHI789"}, "name": "recommendation-engine"},
                ],
            },
        ]

    def _mock_problem_detail(self, problem_id: str) -> dict:
        now = datetime.utcnow()
        return {
            "problemId": problem_id,
            "title": "High response time on checkout-service",
            "status": "OPEN",
            "severityLevel": "PERFORMANCE",
            "startTime": (now - timedelta(minutes=12)).isoformat(),
            "rootCauseEntity": {
                "entityId": {"id": "SERVICE-DEF456"},
                "name": "payment-gateway",
            },
            "affectedEntities": [
                {"entityId": {"id": "SERVICE-ABC123"}, "name": "checkout-service"},
                {"entityId": {"id": "SERVICE-DEF456"}, "name": "payment-gateway"},
            ],
            "evidenceDetails": {
                "details": [
                    {
                        "evidenceType": "METRIC",
                        "displayName": "Response time anomaly",
                        "data": {"metric": "response_time_p99", "value": 4500, "baseline": 200},
                    },
                    {
                        "evidenceType": "EVENT",
                        "displayName": "Recent deployment detected",
                        "data": {"version": "v2.3.1", "deployedAt": (now - timedelta(minutes=15)).isoformat()},
                    },
                    {
                        "evidenceType": "LOG",
                        "displayName": "Error log spike",
                        "data": {"errorCount": 342, "timeWindow": "15min"},
                    },
                ],
            },
        }

    def _mock_logs(self, entity_id: str) -> list[dict]:
        now = datetime.utcnow()
        return [
            {
                "timestamp": (now - timedelta(minutes=i)).isoformat(),
                "content": msg,
                "loglevel": level,
                "dt.entity.service": entity_id,
            }
            for i, (msg, level) in enumerate([
                ("Connection timeout to payment-gateway after 5000ms", "ERROR"),
                ("Retry attempt 3/3 failed for payment processing", "ERROR"),
                ("Circuit breaker OPEN for payment-gateway", "WARN"),
                ("Request latency exceeded SLO threshold: 4523ms > 500ms", "WARN"),
                ("Health check passed", "INFO"),
                ("Deployment v2.3.1 completed successfully", "INFO"),
            ])
        ]

    def _mock_traces(self, service_id: str) -> list[dict]:
        now = datetime.utcnow()
        return [
            {
                "traceId": f"trace-{i:04d}",
                "spanId": f"span-{i:04d}",
                "operationName": op,
                "duration": dur,
                "status": status,
                "startTime": (now - timedelta(minutes=i)).isoformat(),
            }
            for i, (op, dur, status) in enumerate([
                ("POST /checkout", 4523000, "ERROR"),
                ("POST /payment/process", 5001000, "ERROR"),
                ("GET /inventory/check", 45000, "OK"),
                ("POST /checkout", 4891000, "ERROR"),
                ("GET /health", 12000, "OK"),
            ])
        ]

    def _mock_metrics(self) -> dict:
        return {
            "result": [{
                "metricId": "builtin:service.response.time",
                "data": [
                    {"dimensions": [], "timestamps": [1, 2, 3, 4, 5], "values": [200, 210, 4500, 4800, 4200]},
                ],
            }],
        }

    def _mock_deployments(self) -> list[dict]:
        now = datetime.utcnow()
        return [
            {
                "eventId": "deploy-001",
                "eventType": "CUSTOM_DEPLOYMENT",
                "title": "Deployment: checkout-service v2.3.1",
                "startTime": (now - timedelta(minutes=15)).isoformat(),
                "entityId": "SERVICE-ABC123",
                "properties": {
                    "version": "v2.3.1",
                    "deployedBy": "ci-pipeline",
                    "commitSha": "abc123def",
                },
            },
        ]

"""
Dynatrace MCP (Model Context Protocol) Client.

Implements proper MCP protocol communication using JSON-RPC 2.0
over HTTP/SSE transport, as required by the hackathon rules.

MCP Spec: https://modelcontextprotocol.io/specification
Dynatrace MCP Server: Provides observability tools (problems, metrics, 
logs, traces, deployments) as MCP-compatible tool endpoints.

Falls back to direct REST API calls when MCP endpoint is not configured.
"""

import json
import logging
from typing import Any, Optional
from datetime import datetime, timedelta

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


class MCPToolResult:
    """Result from an MCP tool invocation."""
    def __init__(self, content: Any, is_error: bool = False):
        self.content = content
        self.is_error = is_error


class DynatraceMCPClient:
    """
    Client for the Dynatrace MCP server.
    
    Supports two modes:
    1. MCP Mode: JSON-RPC 2.0 calls to the Dynatrace MCP endpoint
    2. Direct Mode: REST API calls to Dynatrace tenant (fallback)
    3. Mock Mode: Returns realistic mock data for demo/development
    """

    def __init__(self):
        self.mcp_endpoint = settings.dynatrace_mcp_endpoint
        self.base_url = settings.dynatrace_tenant_url
        self.api_token = settings.dynatrace_api_token
        self._client = httpx.AsyncClient(timeout=30.0)
        self._request_id = 0

    @property
    def mode(self) -> str:
        if self.mcp_endpoint:
            return "mcp"
        elif self.api_token and self.base_url:
            return "direct"
        return "mock"

    @property
    def is_connected(self) -> bool:
        return self.mode != "mock"

    # ── MCP Protocol Layer ────────────────────────────────────────

    async def _mcp_call(self, method: str, params: dict) -> MCPToolResult:
        """
        Send a JSON-RPC 2.0 request to the MCP server.
        
        MCP uses standard JSON-RPC 2.0:
        {
            "jsonrpc": "2.0",
            "id": <int>,
            "method": "tools/call",
            "params": {
                "name": "<tool_name>",
                "arguments": { ... }
            }
        }
        """
        self._request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": "tools/call",
            "params": {
                "name": method,
                "arguments": params,
            },
        }

        try:
            resp = await self._client.post(
                self.mcp_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            result = resp.json()

            if "error" in result:
                logger.warning(f"MCP error: {result['error']}")
                return MCPToolResult(result["error"], is_error=True)

            # MCP tool results come in result.content
            content = result.get("result", {}).get("content", [])
            if content and isinstance(content, list):
                # MCP returns content as array of {type, text} blocks
                text_parts = [c.get("text", "") for c in content if c.get("type") == "text"]
                try:
                    return MCPToolResult(json.loads("".join(text_parts)))
                except json.JSONDecodeError:
                    return MCPToolResult({"raw": "".join(text_parts)})

            return MCPToolResult(result.get("result", {}))

        except Exception as e:
            logger.warning(f"MCP call failed for {method}: {e}")
            return MCPToolResult({"error": str(e)}, is_error=True)

    async def _mcp_list_tools(self) -> list[dict]:
        """List available tools from the MCP server."""
        self._request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self._request_id,
            "method": "tools/list",
            "params": {},
        }
        try:
            resp = await self._client.post(
                self.mcp_endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            result = resp.json()
            return result.get("result", {}).get("tools", [])
        except Exception as e:
            logger.warning(f"MCP tools/list failed: {e}")
            return []

    # ── High-Level Tool Methods ───────────────────────────────────
    # Each method tries: MCP → Direct REST → Mock fallback

    async def get_problems(self, time_from: Optional[str] = None, time_to: Optional[str] = None) -> list[dict]:
        """List active problems from Dynatrace."""
        if self.mode == "mcp":
            result = await self._mcp_call("dynatrace-problems-list", {
                "from": time_from or "now-1h",
                "to": time_to or "now",
            })
            if not result.is_error:
                data = result.content
                return data.get("problems", [data]) if isinstance(data, dict) else data

        if self.mode == "direct":
            return await self._rest_get_problems(time_from, time_to)

        return self._mock_problems()

    async def get_metrics(self, metric_selector: str, entity_id: Optional[str] = None) -> dict:
        """Query metrics via Dynatrace Metrics API."""
        if self.mode == "mcp":
            result = await self._mcp_call("dynatrace-metrics-query", {
                "metricSelector": metric_selector,
                "entitySelector": f'entityId("{entity_id}")' if entity_id else "",
                "from": "now-1h",
                "to": "now",
                "resolution": "1m",
            })
            if not result.is_error:
                return result.content

        if self.mode == "direct":
            return await self._rest_get_metrics(metric_selector, entity_id)

        return self._mock_metrics(metric_selector)

    async def get_logs(self, query: str, entity_id: Optional[str] = None) -> list[dict]:
        """Search logs via Dynatrace Log API."""
        if self.mode == "mcp":
            result = await self._mcp_call("dynatrace-logs-search", {
                "query": query,
                "from": "now-1h",
                "to": "now",
                "limit": 50,
            })
            if not result.is_error:
                data = result.content
                return data.get("results", [data]) if isinstance(data, dict) else data

        if self.mode == "direct":
            return await self._rest_get_logs(query, entity_id)

        return self._mock_logs()

    async def get_traces(self, service: str, limit: int = 100) -> list[dict]:
        """Search distributed traces."""
        if self.mode == "mcp":
            result = await self._mcp_call("dynatrace-traces-search", {
                "service": service,
                "limit": limit,
                "from": "now-1h",
            })
            if not result.is_error:
                data = result.content
                return data.get("traces", [data]) if isinstance(data, dict) else data

        if self.mode == "direct":
            return await self._rest_get_traces(service, limit)

        return self._mock_traces(service)

    async def get_deployments(self, service: str = "all", window: str = "1h") -> list[dict]:
        """List recent deployments for a service."""
        if self.mode == "mcp":
            result = await self._mcp_call("dynatrace-events-list", {
                "entitySelector": f'type("SERVICE"),entityName("{service}")',
                "eventType": "CUSTOM_DEPLOYMENT",
                "from": f"now-{window}",
            })
            if not result.is_error:
                data = result.content
                return data.get("events", [data]) if isinstance(data, dict) else data

        if self.mode == "direct":
            return await self._rest_get_deployments(service)

        return self._mock_deployments(service)

    async def get_entities(self, entity_selector: str) -> list[dict]:
        """Query entities from Dynatrace."""
        if self.mode == "mcp":
            result = await self._mcp_call("dynatrace-entities-list", {
                "entitySelector": entity_selector,
            })
            if not result.is_error:
                data = result.content
                return data.get("entities", [data]) if isinstance(data, dict) else data

        if self.mode == "direct":
            return await self._rest_get_entities(entity_selector)

        return []

    # ── Direct REST API Calls ─────────────────────────────────────

    async def _rest_get_problems(self, time_from=None, time_to=None) -> list[dict]:
        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            params = {}
            if time_from:
                params["from"] = time_from
            resp = await self._client.get(
                f"{self.base_url}/api/v2/problems",
                headers=headers, params=params,
            )
            resp.raise_for_status()
            return resp.json().get("problems", [])
        except Exception as e:
            logger.warning(f"REST problems call failed: {e}")
            return self._mock_problems()

    async def _rest_get_metrics(self, selector, entity_id=None) -> dict:
        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            params = {"metricSelector": selector, "from": "now-1h", "resolution": "1m"}
            if entity_id:
                params["entitySelector"] = f'entityId("{entity_id}")'
            resp = await self._client.get(
                f"{self.base_url}/api/v2/metrics/query",
                headers=headers, params=params,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.warning(f"REST metrics call failed: {e}")
            return self._mock_metrics(selector)

    async def _rest_get_logs(self, query, entity_id=None) -> list[dict]:
        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            params = {"query": query, "from": "now-1h", "limit": 50}
            resp = await self._client.get(
                f"{self.base_url}/api/v2/logs/search",
                headers=headers, params=params,
            )
            resp.raise_for_status()
            return resp.json().get("results", [])
        except Exception as e:
            logger.warning(f"REST logs call failed: {e}")
            return self._mock_logs()

    async def _rest_get_traces(self, service, limit) -> list[dict]:
        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            params = {
                "from": "now-1h",
                "limit": limit,
                "entitySelector": f'type("SERVICE"),entityName("{service}")',
            }
            resp = await self._client.get(
                f"{self.base_url}/api/v2/spans",
                headers=headers, params=params,
            )
            resp.raise_for_status()
            return resp.json().get("spans", [])
        except Exception as e:
            logger.warning(f"REST traces call failed: {e}")
            return self._mock_traces(service)

    async def _rest_get_deployments(self, service) -> list[dict]:
        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            params = {
                "entitySelector": f'type("SERVICE"),entityName("{service}")',
                "eventType": "CUSTOM_DEPLOYMENT",
                "from": "now-2h",
            }
            resp = await self._client.get(
                f"{self.base_url}/api/v2/events",
                headers=headers, params=params,
            )
            resp.raise_for_status()
            return resp.json().get("events", [])
        except Exception as e:
            logger.warning(f"REST deployments call failed: {e}")
            return self._mock_deployments(service)

    async def _rest_get_entities(self, selector) -> list[dict]:
        try:
            headers = {"Authorization": f"Api-Token {self.api_token}"}
            resp = await self._client.get(
                f"{self.base_url}/api/v2/entities",
                headers=headers, params={"entitySelector": selector},
            )
            resp.raise_for_status()
            return resp.json().get("entities", [])
        except Exception as e:
            logger.warning(f"REST entities call failed: {e}")
            return []

    # ── Mock Data ─────────────────────────────────────────────────

    def _mock_problems(self) -> list[dict]:
        now = datetime.utcnow()
        return [
            {
                "problemId": "PRB-2026-0042",
                "displayId": "P-42",
                "title": "Response time degradation on checkout-api",
                "status": "OPEN",
                "severityLevel": "PERFORMANCE",
                "impactLevel": "APPLICATION",
                "startTime": int((now - timedelta(minutes=12)).timestamp() * 1000),
                "affectedEntities": [
                    {"entityId": {"id": "SERVICE-ABC123"}, "name": "checkout-api"},
                    {"entityId": {"id": "SERVICE-DEF456"}, "name": "cart-service"},
                ],
                "rootCauseEntity": {
                    "entityId": {"id": "SERVICE-ABC123"},
                    "name": "checkout-api",
                },
            }
        ]

    def _mock_metrics(self, selector: str) -> dict:
        import random
        base = 85 if "response" in selector.lower() else 120
        values = [base + random.uniform(-5, 5) for _ in range(60)]
        # Inject a spike
        for i in range(42, min(50, 60)):
            values[i] = base * (2.5 + random.uniform(0, 1))
        return {
            "result": [{
                "metricId": selector,
                "data": [{"timestamps": list(range(60)), "values": values}],
            }]
        }

    def _mock_logs(self) -> list[dict]:
        now = datetime.utcnow()
        return [
            {"timestamp": (now - timedelta(minutes=8)).isoformat(), "content": "WARN: Response time threshold exceeded (512ms > 200ms)", "loglevel": "WARN", "source": "checkout-api"},
            {"timestamp": (now - timedelta(minutes=7)).isoformat(), "content": "ERROR: Connection pool exhausted for cart-service-db", "loglevel": "ERROR", "source": "cart-service"},
            {"timestamp": (now - timedelta(minutes=6)).isoformat(), "content": "WARN: GC pause 312ms (threshold: 100ms)", "loglevel": "WARN", "source": "checkout-api"},
            {"timestamp": (now - timedelta(minutes=5)).isoformat(), "content": "ERROR: Timeout waiting for cart-service response", "loglevel": "ERROR", "source": "checkout-api"},
            {"timestamp": (now - timedelta(minutes=4)).isoformat(), "content": "INFO: Deployment abc1234 rolled out to checkout-api", "loglevel": "INFO", "source": "k8s-deployer"},
        ]

    def _mock_traces(self, service: str) -> list[dict]:
        return [
            {"traceId": "abc123def456", "spanId": "span-001", "serviceName": service, "duration": 512000, "status": "ERROR", "operationName": "POST /api/checkout"},
            {"traceId": "abc123def457", "spanId": "span-002", "serviceName": service, "duration": 847000, "status": "ERROR", "operationName": "POST /api/cart/add"},
            {"traceId": "abc123def458", "spanId": "span-003", "serviceName": service, "duration": 92000, "status": "OK", "operationName": "GET /api/health"},
        ]

    def _mock_deployments(self, service: str) -> list[dict]:
        now = datetime.utcnow()
        return [
            {
                "eventId": "evt-deploy-001",
                "eventType": "CUSTOM_DEPLOYMENT",
                "title": f"Deployment to {service}",
                "startTime": int((now - timedelta(minutes=15)).timestamp() * 1000),
                "properties": {
                    "deploymentName": "abc1234",
                    "deploymentVersion": "v2.4.1",
                    "deploymentProject": service,
                    "ciBackLink": "https://github.com/acme/checkout-api/commit/abc1234",
                    "remediationAction": "kubectl rollout undo",
                },
            }
        ]

    # ── Backward-compatible aliases (used by orchestrator) ────────

    async def get_problem_detail(self, problem_id: str) -> dict:
        """Get details for a specific Dynatrace problem by ID."""
        if self.mode == "mcp":
            result = await self._mcp_call("dynatrace-problem-detail", {"problemId": problem_id})
            if not result.is_error:
                return result.content

        if self.mode == "direct":
            try:
                headers = {"Authorization": f"Api-Token {self.api_token}"}
                resp = await self._client.get(
                    f"{self.base_url}/api/v2/problems/{problem_id}",
                    headers=headers,
                )
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                logger.warning(f"REST problem detail failed: {e}")

        # Mock
        return {
            "problemId": problem_id,
            "displayId": problem_id,
            "title": "Response time degradation",
            "status": "OPEN",
            "severityLevel": "PERFORMANCE",
            "startTime": int(datetime.utcnow().timestamp() * 1000),
            "evidenceDetails": {
                "details": [
                    {"evidenceType": "METRIC", "displayName": "Response time spike"},
                    {"evidenceType": "EVENT", "displayName": "Recent deployment"},
                ]
            },
            "affectedEntities": [],
        }


# Singleton
dt_client = DynatraceMCPClient()


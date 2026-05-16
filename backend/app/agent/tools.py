"""Tool definitions for the Agent Builder agent."""

TOOL_DEFINITIONS = [
    {
        "name": "dynatrace_get_problems",
        "description": "List active problems from Dynatrace within a time range",
        "parameters": {
            "time_from": {"type": "string", "description": "ISO8601 start time"},
            "time_to": {"type": "string", "description": "ISO8601 end time"},
        },
    },
    {
        "name": "dynatrace_get_problem_detail",
        "description": "Get detailed information about a specific Dynatrace problem including events and affected entities",
        "parameters": {
            "problem_id": {"type": "string", "description": "Dynatrace problem ID"},
        },
    },
    {
        "name": "dynatrace_get_logs",
        "description": "Fetch log entries for an entity within a time window",
        "parameters": {
            "entity_id": {"type": "string", "description": "Dynatrace entity ID"},
            "time_from": {"type": "string", "description": "ISO8601 start time"},
            "time_to": {"type": "string", "description": "ISO8601 end time"},
            "query": {"type": "string", "description": "Log query filter (DQL)"},
        },
    },
    {
        "name": "dynatrace_get_traces",
        "description": "Fetch distributed traces/spans for a service",
        "parameters": {
            "service_id": {"type": "string", "description": "Service entity ID"},
            "time_from": {"type": "string", "description": "ISO8601 start time"},
            "time_to": {"type": "string", "description": "ISO8601 end time"},
        },
    },
    {
        "name": "dynatrace_get_metrics",
        "description": "Query specific metric timeseries from Dynatrace",
        "parameters": {
            "metric_selector": {"type": "string", "description": "Dynatrace metric selector"},
            "entity_selector": {"type": "string", "description": "Entity selector"},
            "time_from": {"type": "string", "description": "ISO8601 start time"},
            "time_to": {"type": "string", "description": "ISO8601 end time"},
        },
    },
    {
        "name": "dynatrace_get_deployments",
        "description": "List recent deployment/change events from Dynatrace",
        "parameters": {
            "time_from": {"type": "string", "description": "ISO8601 start time"},
            "time_to": {"type": "string", "description": "ISO8601 end time"},
            "entity_id": {"type": "string", "description": "Optional: filter by entity"},
        },
    },
    {
        "name": "propose_remediation",
        "description": "Propose a remediation action for human approval",
        "parameters": {
            "type": {"type": "string", "enum": ["rollback", "scale_up", "feature_flag", "restart", "manual", "config_change"]},
            "description": {"type": "string", "description": "What will be done"},
            "expected_effect": {"type": "string", "description": "Expected outcome"},
            "blast_radius": {"type": "string", "description": "What could be affected"},
            "rollback_plan": {"type": "string", "description": "How to undo this"},
        },
    },
    {
        "name": "write_rca",
        "description": "Generate and store a post-incident Root Cause Analysis report",
        "parameters": {
            "incident_id": {"type": "string", "description": "Incident to generate RCA for"},
        },
    },
    {
        "name": "notify_slack",
        "description": "Send a notification to a Slack channel",
        "parameters": {
            "message": {"type": "string", "description": "Notification message"},
            "channel": {"type": "string", "description": "Slack channel (default: #incidents)"},
            "severity": {"type": "string", "description": "Message severity for formatting"},
        },
    },
]

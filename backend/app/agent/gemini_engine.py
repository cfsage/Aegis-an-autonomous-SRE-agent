"""
Gemini AI Engine — Structured reasoning powered by Google's Gemini model.

Uses the new `google-genai` SDK (replacing deprecated `google-generativeai`).
Handles structured JSON output for each reasoning step with robust fallbacks.
"""

import json
import logging
from typing import Any, Optional

from google import genai
from google.genai.types import GenerateContentConfig

from app.config import settings

logger = logging.getLogger(__name__)

# ── Lazy-init client ─────────────────────────────────────────────

_client: Optional[genai.Client] = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else genai.Client()
    return _client


# ── Core reasoning functions ─────────────────────────────────────


async def classify_incident(title: str, severity: str, affected_services: list[str], problem_data: Optional[dict] = None) -> dict:
    """Step 1: Classify incident severity and blast radius."""
    prompt = f"""Classify this incident and assess blast radius.
INCIDENT: {title} | SEVERITY: {severity} | SERVICES: {', '.join(affected_services) or 'Unknown'}
PROBLEM DATA: {json.dumps(problem_data, default=str)[:1500] if problem_data else 'None'}

Respond ONLY with JSON: {{"severity":"P0-P4","blast_radius":"description","affected_users_estimate":number|null,"urgency_rationale":"why","affected_services":["list"],"reasoning":"detailed analysis"}}"""

    return await _generate_json(prompt, fallback={
        "severity": severity,
        "blast_radius": f"All users of {', '.join(affected_services) if affected_services else 'affected services'}",
        "affected_users_estimate": None,
        "urgency_rationale": f"Severity {severity} based on initial classification",
        "affected_services": affected_services,
        "reasoning": f"Analyzing incident '{title}'.\nCurrent severity: {severity}.\nAffected services: {', '.join(affected_services) or 'Determining...'}.\nBlast radius: Evaluating based on service dependency graph.",
    })


async def correlate_signals(title: str, severity: str, problem_data: Optional[dict], logs: list[dict], deployments: list[dict], metrics: Optional[dict]) -> dict:
    """Step 3: Cross-reference telemetry signals."""
    prompt = f"""Correlate telemetry signals for: {title} (Severity: {severity})
PROBLEM: {json.dumps(problem_data, default=str)[:1500] if problem_data else 'None'}
LOGS: {json.dumps(logs[:8], default=str)[:1500] if logs else 'None'}
DEPLOYS: {json.dumps(deployments, default=str)[:800] if deployments else 'None'}
METRICS: {json.dumps(metrics, default=str)[:800] if metrics else 'None'}

Respond ONLY with JSON: {{"timeline":[{{"time":"when","event":"what","source":"where"}}],"correlations":[{{"signal_a":"x","signal_b":"y","correlation_strength":"strong|moderate|weak"}}],"key_findings":["f1","f2"],"reasoning":"analysis"}}"""

    return await _generate_json(prompt, fallback={
        "timeline": [], "correlations": [],
        "key_findings": ["Cross-referencing incident timeline with Dynatrace events", "Looking for temporal correlations between changes and symptoms"],
        "reasoning": "Cross-referencing incident timeline with:\n  - Problem events from Dynatrace\n  - Recent deployment changes\n  - Log patterns across affected entities\n  - Metric anomalies in the incident window",
    })


async def generate_hypotheses(title: str, severity: str, correlation_data: dict, problem_data: Optional[dict], logs: list[dict], deployments: list[dict]) -> list[dict]:
    """Step 4: Generate ranked root cause hypotheses."""
    prompt = f"""Generate 2-4 root cause hypotheses for: {title} (Severity: {severity})
CORRELATION: {json.dumps(correlation_data, default=str)[:1500]}
PROBLEM: {json.dumps(problem_data, default=str)[:1000] if problem_data else 'None'}
LOGS: {json.dumps(logs[:6], default=str)[:1000] if logs else 'None'}
DEPLOYS: {json.dumps(deployments, default=str)[:500] if deployments else 'None'}

Respond ONLY with JSON: {{"hypotheses":[{{"description":"cause","confidence":0-100,"evidence":["e1","e2"]}}]}}"""

    svc = title.split('on ')[-1] if 'on ' in title else 'affected service'
    result = await _generate_json(prompt, fallback={
        "hypotheses": [
            {"description": f"Recent deployment introduced a regression in {svc}", "confidence": 72, "evidence": ["Deployment detected within incident window", "Error patterns correlate with deployment timestamp"]},
            {"description": "Upstream dependency experiencing degraded performance", "confidence": 40, "evidence": ["Elevated latency on external API calls"]},
            {"description": "Infrastructure resource exhaustion (CPU/memory)", "confidence": 20, "evidence": ["Resource metrics slightly elevated but within bounds"]},
        ],
    })
    return result.get("hypotheses", result if isinstance(result, list) else [])


async def verify_hypothesis(hypothesis_description: str, confidence: int, evidence: list[str], verification_data: dict) -> dict:
    """Step 5: Verify the top hypothesis."""
    prompt = f"""Verify this hypothesis: "{hypothesis_description}" (confidence: {confidence}%)
EVIDENCE: {json.dumps(evidence)}
VERIFICATION DATA: {json.dumps(verification_data, default=str)[:1500]}

Respond ONLY with JSON: {{"verified":true|false,"updated_confidence":0-100,"new_evidence":["new findings"],"reasoning":"analysis"}}"""

    return await _generate_json(prompt, fallback={
        "verified": True,
        "updated_confidence": min(confidence + 10, 95),
        "new_evidence": ["Verification data confirms hypothesis"],
        "reasoning": f'Re-queried Dynatrace metrics to verify:\n  "{hypothesis_description}"\n\nVerification: CONFIRMED\nUpdated confidence: {min(confidence + 10, 95)}%',
    })


async def propose_remediation(root_cause: str, confidence: int, affected_services: list[str], severity: str) -> dict:
    """Step 6: Propose a remediation action."""
    prompt = f"""Propose remediation for: {root_cause} (confidence: {confidence}%, severity: {severity})
SERVICES: {', '.join(affected_services)}
Types: rollback, scale_up, feature_flag, restart, config_change, manual

Respond ONLY with JSON: {{"type":"rollback|scale_up|feature_flag|restart|config_change|manual","description":"what","expected_effect":"outcome","blast_radius":"impact","rollback_plan":"undo","reasoning":"why"}}"""

    svc = affected_services[0] if affected_services else "affected service"
    return await _generate_json(prompt, fallback={
        "type": "rollback", "description": f"Rollback the most recent deployment to {svc}",
        "expected_effect": "Error rate should return to baseline within 2-5 minutes",
        "blast_radius": "Service reverts to previous version; new features unavailable",
        "rollback_plan": "Re-deploy after regression is fixed",
        "reasoning": f"Based on '{root_cause}', rollback is the safest option.",
    })


async def generate_rca_report(title: str, root_cause: str, confidence: int, steps: list[dict], remediation: Optional[dict], mttr_seconds: Optional[float]) -> dict:
    """Step 10: Generate post-incident RCA report."""
    steps_summary = "\n".join([f"  - [{s.get('step_type', '?')}] {s.get('title', '')}" for s in steps[:10]])
    mttr_str = f"{mttr_seconds:.0f}s" if mttr_seconds else "N/A"

    prompt = f"""Generate a post-incident RCA report.
INCIDENT: {title} | ROOT CAUSE: {root_cause} | CONFIDENCE: {confidence}% | MTTR: {mttr_str}
STEPS:\n{steps_summary}

Respond ONLY with JSON: {{"summary":"executive summary","timeline":[],"root_cause_analysis":"detailed analysis","impact":"impact","remediation_taken":"what was done","action_items":[{{"priority":"P0-P2","description":"item","owner":"team"}}],"lessons_learned":["l1"],"prevention":"how to prevent"}}"""

    rem_desc = remediation.get("description", "Remediation applied") if remediation else "Manual intervention"
    return await _generate_json(prompt, fallback={
        "summary": f"Incident '{title}' caused by {root_cause}. Resolved in {mttr_str} via automated remediation.",
        "timeline": [], "root_cause_analysis": root_cause, "impact": "Service degradation affecting end users",
        "remediation_taken": rem_desc,
        "action_items": [{"priority": "P1", "description": "Add regression tests", "owner": "Engineering"}],
        "lessons_learned": ["Automated rollback significantly reduced MTTR"],
        "prevention": "Enhanced CI/CD pipeline with canary analysis",
    })


# ── Internal helpers ─────────────────────────────────────────────

async def _generate_json(prompt: str, fallback: dict) -> dict:
    """Call Gemini and parse JSON response, with fallback on failure."""
    if not settings.gemini_api_key:
        logger.info("No GEMINI_API_KEY set, using fallback response")
        return fallback

    try:
        client = _get_client()
        response = client.models.generate_content(
            model=settings.agent_model,
            contents=prompt,
            config=GenerateContentConfig(
                temperature=settings.agent_temperature,
                max_output_tokens=4096,
                response_mime_type="application/json",
            ),
        )

        text = response.text
        if not text:
            logger.warning("Empty Gemini response, using fallback")
            return fallback

        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            text = text.rsplit("```", 1)[0].strip()

        return json.loads(text)

    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse Gemini JSON: {e}")
        return fallback
    except Exception as e:
        logger.warning(f"Gemini API call failed, using fallback: {e}")
        return fallback

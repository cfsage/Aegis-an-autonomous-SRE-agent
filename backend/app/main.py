"""
Aegis — Autonomous SRE Agent
FastAPI Backend Application
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import incidents, webhooks, stream, approve, adk
from app.config import settings

app = FastAPI(
    title="Aegis SRE Agent",
    description="Autonomous Site Reliability Engineering Agent powered by Gemini 3 + Dynatrace MCP",
    version="0.1.0",
    root_path=os.getenv("API_ROOT_PATH", ""),
)

# CORS — allow frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(stream.router, prefix="/api/stream", tags=["Stream"])
app.include_router(approve.router, prefix="/api/approve", tags=["Approve"])
app.include_router(adk.router, prefix="/api/adk", tags=["ADK Agent"])


@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run."""
    from app.mcp.dynatrace_client import dt_client
    return {
        "status": "healthy",
        "service": "aegis-backend",
        "version": "0.2.0",
        "dynatrace_mode": dt_client.mode,
        "gemini_configured": bool(settings.gemini_api_key),
        "adk_available": True,
    }


@app.get("/")
async def root():
    return {
        "service": "Aegis SRE Agent API",
        "docs": "/docs",
        "health": "/health",
    }

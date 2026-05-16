"""
Aegis — Autonomous SRE Agent
FastAPI Backend Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import incidents, webhooks, stream, approve
from app.config import settings

app = FastAPI(
    title="Aegis SRE Agent",
    description="Autonomous Site Reliability Engineering Agent powered by Gemini 3 + Dynatrace MCP",
    version="0.1.0",
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


@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run."""
    return {"status": "healthy", "service": "aegis-backend", "version": "0.1.0"}


@app.get("/")
async def root():
    return {
        "service": "Aegis SRE Agent API",
        "docs": "/docs",
        "health": "/health",
    }

"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Aegis backend configuration."""

    # GCP
    google_cloud_project: str = ""
    gemini_api_key: str = ""

    # Dynatrace
    dynatrace_tenant_url: str = ""
    dynatrace_api_token: str = ""
    dynatrace_mcp_endpoint: str = ""

    # Firestore
    firestore_project_id: str = ""

    # CORS
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
    ]

    # Agent
    agent_model: str = "gemini-2.5-pro"
    agent_max_steps: int = 10
    agent_temperature: float = 0.1

    # Notification
    slack_webhook_url: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

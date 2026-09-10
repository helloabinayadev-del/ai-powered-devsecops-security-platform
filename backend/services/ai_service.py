"""
Base AI service — optional LLM provider with knowledge-base fallback.
Responses always indicate analysis_mode so clients know the source.
"""

import json
from typing import Any

import requests

from backend.config import (
    AI_API_BASE_URL,
    AI_API_KEY,
    AI_ENABLED,
    AI_MODEL,
    AI_PROVIDER,
    AI_REQUEST_TIMEOUT,
)
from backend.logger import logger


class AIServiceError(Exception):
    """Raised when AI service operations fail."""


class AIService:
    """Unified interface for LLM and knowledge-base analysis."""

    def __init__(self) -> None:
        self.provider = AI_PROVIDER
        self.enabled = AI_ENABLED
        self._llm_available = bool(AI_API_KEY) and AI_PROVIDER == "openai"

    @property
    def analysis_mode(self) -> str:
        if self._llm_available:
            return "llm"
        return "knowledge_base"

    def is_llm_available(self) -> bool:
        return self._llm_available

    def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        """
        Call OpenAI-compatible chat completion API.
        Raises AIServiceError if LLM is not configured or request fails.
        """
        if not self._llm_available:
            raise AIServiceError(
                "LLM provider not configured. Set AI_PROVIDER=openai and AI_API_KEY."
            )

        url = f"{AI_API_BASE_URL.rstrip('/')}/chat/completions"
        headers = {
            "Authorization": f"Bearer {AI_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": AI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.2,
        }

        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=AI_REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        except (requests.RequestException, KeyError, IndexError) as exc:
            logger.error("LLM request failed: %s", exc)
            raise AIServiceError(f"LLM request failed: {exc}") from exc

    def optional_enhance(
        self,
        base_result: dict[str, Any],
        system_prompt: str,
        user_prompt: str,
    ) -> dict[str, Any]:
        """
        Optionally enhance a knowledge-base result with LLM output.
        Falls back silently to base_result on failure.
        """
        if not self._llm_available:
            return {**base_result, "analysis_mode": "knowledge_base"}

        try:
            enhanced = self.generate_text(system_prompt, user_prompt)
            return {
                **base_result,
                "analysis_mode": "llm",
                "llm_enhancement": enhanced,
            }
        except AIServiceError as exc:
            logger.warning("LLM enhancement skipped: %s", exc)
            return {**base_result, "analysis_mode": "knowledge_base"}


def serialize_analysis(data: dict[str, Any]) -> str:
    """Serialize analysis dict for database storage."""
    return json.dumps(data, ensure_ascii=False)


def deserialize_analysis(raw: str) -> dict[str, Any]:
    """Deserialize analysis from database."""
    return json.loads(raw)

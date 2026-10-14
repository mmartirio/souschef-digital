import os
from typing import Dict, List

import httpx


class OllamaService:
    """Cliente mínimo para a API do Ollama."""

    def __init__(self):
        self.base_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b")
        self.timeout = float(os.getenv("OLLAMA_TIMEOUT", "120"))

    async def chat(self, messages: List[Dict[str, str]]) -> str:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "options": {"temperature": 0.4, "num_ctx": 2048, "num_predict": 100},
                },
            )
            response.raise_for_status()
            return response.json()["message"]["content"].strip()

    async def warm_up(self) -> None:
        """Carrega o modelo em memória (o primeiro load pode levar minutos em CPU)."""
        try:
            async with httpx.AsyncClient(timeout=None) as client:
                await client.post(f"{self.base_url}/api/generate", json={"model": self.model})
        except httpx.HTTPError:
            pass

    async def list_models(self) -> List[str]:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{self.base_url}/api/tags")
            response.raise_for_status()
            return [m["name"] for m in response.json().get("models", [])]

    async def is_healthy(self) -> bool:
        try:
            await self.list_models()
            return True
        except httpx.HTTPError:
            return False


ollama_service = OllamaService()

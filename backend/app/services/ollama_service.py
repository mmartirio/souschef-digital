import os
import httpx

class OllamaService:
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    
    async def generate(self, prompt: str, model: str = "llama2"):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={"model": model, "prompt": prompt}
            )
            return response.json()

ollama_service = OllamaService()

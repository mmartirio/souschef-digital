import os
import httpx
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class OllamaService:
    """
    Serviço para integração com Ollama LLM.
    """
    
    def __init__(self):
        self.base_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
        self.timeout = float(os.getenv("OLLAMA_TIMEOUT", "60.0"))
        self.default_model = os.getenv("OLLAMA_MODEL", "llama2")
    
    async def generate(
        self, 
        prompt: str, 
        model: Optional[str] = None,
        stream: bool = False,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Gera texto usando o modelo Ollama.
        
        Args:
            prompt: O prompt para geração
            model: Modelo a ser usado (padrão: llama2)
            stream: Se deve fazer streaming da resposta
            options: Opções adicionais para o modelo
            
        Returns:
            Dicionário com a resposta do modelo
        """
        if model is None:
            model = self.default_model
            
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "model": model,
                    "prompt": prompt,
                    "stream": stream
                }
                
                if options:
                    payload["options"] = options
                
                logger.info(f"Generating text with model: {model}")
                
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                
                response.raise_for_status()
                return response.json()
                
        except httpx.TimeoutException:
            logger.error(f"Ollama request timed out after {self.timeout}s")
            raise Exception("Request to Ollama timed out")
        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling Ollama: {str(e)}")
            raise Exception(f"Error calling Ollama service: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error calling Ollama: {str(e)}")
            raise Exception(f"Unexpected error: {str(e)}")
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Mantém uma conversa com o modelo.
        
        Args:
            messages: Lista de mensagens no formato [{"role": "user", "content": "..."}]
            model: Modelo a ser usado
            
        Returns:
            Dicionário com a resposta do modelo
        """
        if model is None:
            model = self.default_model
            
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                payload = {
                    "model": model,
                    "messages": messages
                }
                
                logger.info(f"Chat with model: {model}")
                
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                )
                
                response.raise_for_status()
                return response.json()
                
        except Exception as e:
            logger.error(f"Error in chat: {str(e)}")
            raise Exception(f"Error in chat: {str(e)}")
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """
        Lista todos os modelos disponíveis no Ollama.
        
        Returns:
            Lista de modelos disponíveis
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                return response.json().get("models", [])
        except Exception as e:
            logger.error(f"Error listing models: {str(e)}")
            return []
    
    async def check_health(self) -> bool:
        """
        Verifica se o serviço Ollama está disponível.
        
        Returns:
            True se o serviço está disponível, False caso contrário
        """
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/")
                return response.status_code == 200
        except Exception:
            return False

# Instância global do serviço
ollama_service = OllamaService()

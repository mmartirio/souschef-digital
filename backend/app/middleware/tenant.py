from fastapi import Request
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class TenantMiddleware:
    """
    Middleware para suporte a multi-tenancy.
    Pode ser usado para isolar dados por usuário ou organização.
    """
    
    async def __call__(self, request: Request, call_next):
        # Extrai tenant_id do header customizado (se fornecido)
        tenant_id = request.headers.get("X-Tenant-ID")
        
        if tenant_id:
            # Adiciona tenant_id ao request state
            request.state.tenant_id = tenant_id
            logger.info(f"Request from tenant: {tenant_id}")
        else:
            # Se não houver tenant_id, usa None (single-tenant ou usuário individual)
            request.state.tenant_id = None
        
        # Adiciona informações extras de contexto
        request.state.client_ip = request.client.host if request.client else None
        request.state.user_agent = request.headers.get("User-Agent")
        
        response = await call_next(request)
        
        # Adiciona headers de resposta com informações de tenant
        if hasattr(request.state, "tenant_id") and request.state.tenant_id:
            response.headers["X-Tenant-ID"] = request.state.tenant_id
        
        return response

def get_tenant_id(request: Request) -> Optional[str]:
    """
    Helper function para obter tenant_id do request.
    """
    return getattr(request.state, "tenant_id", None)

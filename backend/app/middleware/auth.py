from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

from app.utils.security import verify_token

logger = logging.getLogger(__name__)

security = HTTPBearer()

class AuthMiddleware:
    """
    Middleware para validação de autenticação JWT.
    """
    
    async def __call__(self, request: Request, call_next):
        # Rotas públicas que não precisam de autenticação
        public_routes = [
            "/",
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/auth/login",
            "/auth/register"
        ]
        
        # Verifica se é uma rota pública
        if request.url.path in public_routes or request.url.path.startswith("/auth/"):
            return await call_next(request)
        
        # Extrai token do header Authorization
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            logger.warning(f"No authorization header in request to {request.url.path}")
            # Permite continuar, a validação será feita pelos Depends nas rotas
            return await call_next(request)
        
        try:
            # Valida formato do token
            if not auth_header.startswith("Bearer "):
                logger.warning(f"Invalid authorization format in request to {request.url.path}")
                return await call_next(request)
            
            token = auth_header.split(" ")[1]
            
            # Verifica token
            payload = verify_token(token)
            
            if payload is None:
                logger.warning(f"Invalid token in request to {request.url.path}")
                # Permite continuar, a validação será feita pelos Depends nas rotas
                return await call_next(request)
            
            # Adiciona informações do usuário ao request state
            request.state.user_data = payload
            request.state.authenticated = True
            
        except Exception as e:
            logger.error(f"Error in auth middleware: {str(e)}")
        
        return await call_next(request)

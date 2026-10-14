from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
import bcrypt
import os
import secrets
from dotenv import load_dotenv

load_dotenv()


# Configurações de segurança
# Chave que assina os tokens: quem a conhece consegue se passar por qualquer usuário.
SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY or SECRET_KEY == "troque-esta-chave":
    raise RuntimeError(
        "Defina SECRET_KEY no .env com um valor aleatório, ex.: "
        "python -c \"import secrets; print(secrets.token_urlsafe(32))\""
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


def _to_bytes(password: str) -> bytes:
    # bcrypt considera apenas os primeiros 72 bytes (e o bcrypt>=5 rejeita entradas maiores)
    return password.encode("utf-8")[:72]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha em texto plano corresponde ao hash."""
    try:
        return bcrypt.checkpw(_to_bytes(plain_password), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def get_password_hash(password: str) -> str:
    """Gera o hash da senha."""
    return bcrypt.hashpw(_to_bytes(password), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria um token de acesso JWT."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str):
    """Verifica o token JWT e retorna os dados decodificados."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def create_refresh_token(data: dict) -> str:
    """Cria um refresh token com validade maior."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def generate_reset_token() -> str:
    """Gera um token aleatório para reset de senha."""
    return secrets.token_urlsafe(32)

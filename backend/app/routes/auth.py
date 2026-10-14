import secrets
from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas import GoogleLogin, Token, UserCreate, UserOut
from app.services.google_auth_service import google_auth_service
from app.utils.rate_limit import login_limiter
from app.utils.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    get_password_hash,
    verify_password,
    verify_token,
)

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def _user_from_token(token: Optional[str], db: Session) -> Optional[User]:
    payload = verify_token(token) if token else None
    if not payload or "sub" not in payload:
        return None
    user = db.get(User, int(payload["sub"]))
    return user if user and user.is_active else None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    user = _user_from_token(token, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)
) -> Optional[User]:
    return _user_from_token(token, db)


def _issue_token(user: User) -> Token:
    token = create_access_token(
        {"sub": str(user.id)}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    username = data.username or data.email
    if db.query(User).filter(or_(User.email == data.email, User.username == username)).first():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email ou usuário já cadastrado")

    user = User(
        email=data.email,
        username=username,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_token(user)


@router.post("/login", response_model=Token)
def login(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login por email ou username (form-urlencoded: username, password)."""
    keys = (f"user:{form.username.lower()}", f"ip:{request.client.host if request.client else '-'}")
    login_limiter.check(*keys)
    user = db.query(User).filter(
        or_(User.username == form.username, User.email == form.username)
    ).first()
    if not user or not verify_password(form.password, user.hashed_password):
        login_limiter.fail(*keys)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email ou senha incorretos")
    login_limiter.success(keys[0])
    if not user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Usuário inativo")
    return _issue_token(user)


@router.post("/google", response_model=Token)
async def google_login(data: GoogleLogin, db: Session = Depends(get_db)):
    """Login/cadastro com Google: valida o id_token e vincula pela conta de email."""
    if not google_auth_service.enabled:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Login com Google não configurado")
    identity = await google_auth_service.verify(data.id_token)
    if identity is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token do Google inválido")

    user = db.query(User).filter(User.email == identity.email).first()
    if user is None:
        user = User(
            email=identity.email,
            username=identity.email,
            full_name=identity.name,
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),  # senha inutilizável
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    if not user.is_active:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Usuário inativo")
    return _issue_token(user)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user

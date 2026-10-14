import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import models  # noqa: F401  (registra os modelos no metadata)
from app.database.connection import Base, SessionLocal, engine, get_db, migrate
from app.routes import ai, auth, categories, favorites, recipes, users
from app.routes.auth import get_current_user
from app.services.ollama_service import ollama_service
from app.services.recipes import seed_recipes
from app.services.transcription_service import transcription_service

Base.metadata.create_all(bind=engine)
migrate()
users.MEDIA_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    with SessionLocal() as db:
        seed_recipes(db)
    # Pré-carrega os modelos em segundo plano para a primeira conversa por voz ser rápida
    tasks = [
        asyncio.create_task(ollama_service.warm_up()),
        asyncio.create_task(asyncio.to_thread(transcription_service.warm_up)),
    ]
    yield
    for task in tasks:
        task.cancel()


# Documentação interativa (/docs) só quando ENABLE_DOCS=true (ex.: desenvolvimento).
DOCS = os.getenv("ENABLE_DOCS", "false").lower() == "true"
app = FastAPI(
    title="SousChef Digital API",
    version="1.1.0",
    lifespan=lifespan,
    docs_url="/docs" if DOCS else None,
    redoc_url=None,
    openapi_url="/openapi.json" if DOCS else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "SousChef Digital API", "status": "running"}


@app.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(503, "Banco de dados indisponível")  # sem detalhes internos
    return {"status": "healthy", "database": "connected"}


# Só /auth (entrar e cadastrar) e /health são públicos: todo o resto exige um usuário válido.
LOGGED_IN = [Depends(get_current_user)]
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"], dependencies=LOGGED_IN)
app.include_router(users.media_router, prefix=users.MEDIA_URL, tags=["media"], dependencies=LOGGED_IN)
app.include_router(recipes.router, prefix="/recipes", tags=["recipes"], dependencies=LOGGED_IN)
app.include_router(categories.router, prefix="/categories", tags=["categories"], dependencies=LOGGED_IN)
app.include_router(favorites.router, prefix="/favorites", tags=["favorites"], dependencies=LOGGED_IN)
app.include_router(ai.router, prefix="/ai", tags=["ai"], dependencies=LOGGED_IN)

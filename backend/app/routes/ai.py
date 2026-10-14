import os
import tempfile
from typing import List, Optional

import httpx
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.routes.auth import get_current_user
from app.routes.recipes import get_recipe_or_404
from app.schemas import AIHealth, ChatRequest, ChatResponse, RecipeMatch, RecipeSearch, Transcription
from app.services.knowledge_service import knowledge_service
from app.services.ollama_service import ollama_service
from app.services.recipes import STRONG_MATCH, describe_recipe, find_recipes, search_requested_recipe
from app.services.transcription_service import transcription_service
from app.utils.uploads import read_limited

router = APIRouter()

MAX_HISTORY = 10  # mantém o prompt curto para modelos pequenos
MAX_AUDIO_BYTES = 10 * 1024 * 1024

SYSTEM_PROMPT = """Você é o SousChef, um assistente culinário que conversa por voz em português do Brasil.
Ajude com receitas, técnicas, substituições de ingredientes, tempos e quantidades.
Responda em no máximo 2 frases curtas, naturais para serem lidas em voz alta,
sem markdown, listas ou emojis. Use as informações de referência quando forem úteis.
Se não souber, diga que não sabe."""

def _recipe_context(db: Session, question: str, recipe_id: Optional[int]) -> str:
    """Receita em preparo (modo guiado) ou a receita do app que combina com a pergunta."""
    if recipe_id:
        return "O usuário está preparando esta receita. " + describe_recipe(get_recipe_or_404(db, recipe_id))
    matches = find_recipes(db, question)
    if not matches:
        return ""
    coverage, best = matches[0]
    if coverage < STRONG_MATCH:  # só palavras soltas em comum: basta citar os nomes
        return "Receitas no app com nome parecido: " + "; ".join(r.title for _, r in matches)
    context = "Receita do app citada na pergunta: " + describe_recipe(best, max_instructions=250)
    if len(matches) > 1:
        context += "\nOutras receitas no app: " + "; ".join(r.title for _, r in matches[1:])
    return context


def build_system_prompt(db: Session, question: str, recipe_id: Optional[int]) -> str:
    sections = [SYSTEM_PROMPT, _recipe_context(db, question, recipe_id)]
    sections += [f"Referência ({e.topic}): {e.content}" for e in knowledge_service.search(question, limit=2)]
    return "\n\n".join(s for s in sections if s)


@router.get("/health", response_model=AIHealth)
async def health():
    return AIHealth(
        ollama=await ollama_service.is_healthy(),
        model=ollama_service.model,
        transcription=transcription_service.available,
    )


@router.get("/models", response_model=List[str])
async def models():
    try:
        return await ollama_service.list_models()
    except httpx.HTTPError:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Ollama indisponível")


@router.get("/find-recipe", response_model=RecipeSearch)
def find_recipe(q: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """Procura no livro de receitas a receita pedida; se o pedido for ambíguo, devolve opções."""
    recipe, options = search_requested_recipe(db, q)
    as_match = lambda r: RecipeMatch(id=r.id, title=r.title)  # noqa: E731
    return RecipeSearch(match=as_match(recipe) if recipe else None, options=[as_match(r) for r in options])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    question = request.messages[-1].content
    system = build_system_prompt(db, question, request.recipe_id)
    history = [m.model_dump() for m in request.messages[-MAX_HISTORY:]]
    try:
        reply = await ollama_service.chat([{"role": "system", "content": system}, *history])
    except httpx.HTTPError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, f"Ollama indisponível ({type(exc).__name__})")
    return ChatResponse(response=reply, model=ollama_service.model)


@router.post("/transcribe", response_model=Transcription)
async def transcribe(file: UploadFile = File(...), _: User = Depends(get_current_user)):
    if not transcription_service.available:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Transcrição indisponível (instale faster-whisper)")

    content = await read_limited(file, MAX_AUDIO_BYTES, "Áudio muito grande")
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Arquivo de áudio vazio")

    suffix = os.path.splitext(file.filename or "")[1] or ".m4a"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
    try:
        return await run_in_threadpool(transcription_service.transcribe, tmp.name)
    except Exception as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Não foi possível transcrever: {exc}")
    finally:
        os.unlink(tmp.name)

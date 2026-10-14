"""Contratos da API (entrada/saída). Espelhados em frontend/lib/types.ts."""
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Difficulty = Literal["easy", "medium", "hard"]
Role = Literal["user", "assistant"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Auth / Users ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None
    username: Optional[str] = None  # padrão: email


class GoogleLogin(BaseModel):
    id_token: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(default=None, min_length=6)


class UserOut(ORM):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Recipes ----------
class IngredientIn(BaseModel):
    name: str
    quantity: Optional[str] = None


class IngredientOut(ORM, IngredientIn):
    id: int


class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    instructions: str
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    difficulty: Optional[Difficulty] = None
    country: Optional[str] = None  # país de criação do prato


class RecipeCreate(RecipeBase):
    ingredients: List[IngredientIn] = []
    client_ref: Optional[str] = None  # id gerado no celular (criação offline idempotente)
    client_updated_at: Optional[datetime] = None  # quando foi feita no celular


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    difficulty: Optional[Difficulty] = None
    country: Optional[str] = None
    ingredients: Optional[List[IngredientIn]] = None
    # Quando a edição foi feita no celular; se o servidor tiver versão mais nova, ela vence.
    client_updated_at: Optional[datetime] = None


class RecipeOut(ORM, RecipeBase):
    id: int
    user_id: int
    from_book: bool = False  # receita do livro: qualquer usuário logado pode editar
    ingredients: List[IngredientOut] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SyncSnapshot(BaseModel):
    """Tudo que o celular guarda no banco local (SQLite)."""
    server_time: datetime
    recipes: List[RecipeOut]
    favorite_ids: List[int]


class CountryCount(BaseModel):
    country: str
    recipe_count: int


# ---------- Categories / Favorites ----------
class CategoryOut(BaseModel):
    id: int
    name: str
    description: str
    difficulty: Difficulty
    recipe_count: int = 0


class FavoriteIn(BaseModel):
    recipe_id: int


# ---------- AI ----------
class ChatMessage(BaseModel):
    role: Role
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage] = Field(min_length=1)
    recipe_id: Optional[int] = None  # dá contexto da receita ao agente (modo guiado)


class ChatResponse(BaseModel):
    response: str
    model: str


class RecipeMatch(BaseModel):
    id: int
    title: str


class RecipeSearch(BaseModel):
    match: Optional[RecipeMatch]  # receita escolhida para abrir no modo guiado
    options: List[RecipeMatch]  # sugestões quando o pedido é ambíguo


class Transcription(BaseModel):
    text: str
    language: str
    duration: float


class AIHealth(BaseModel):
    ollama: bool
    model: str
    transcription: bool

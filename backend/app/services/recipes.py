"""Construção de receitas e carga inicial (seed) a partir de app/knowledge/receitas/*.json."""
import json
import secrets
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.recipe import Ingredient, Recipe
from app.models.user import BOOK_AUTHOR_EMAIL, User
from app.schemas import RecipeCreate
from app.services.knowledge_service import KNOWLEDGE_DIR, tokenize
from app.utils.security import get_password_hash

SEED_DIR = KNOWLEDGE_DIR / "receitas"
STRONG_MATCH = 0.6  # mais da metade do título precisa estar no texto para a receita ser "citada"


def build_recipe(data: RecipeCreate, user_id: int) -> Recipe:
    return Recipe(
        **data.model_dump(exclude={"ingredients", "client_updated_at"}),
        user_id=user_id,
        ingredients=[Ingredient(**i.model_dump()) for i in data.ingredients],
    )


def describe_recipe(recipe: Recipe, max_instructions: Optional[int] = None) -> str:
    """Texto compacto da receita para o prompt do agente."""
    instructions = recipe.instructions
    if max_instructions and len(instructions) > max_instructions:
        instructions = instructions[:max_instructions].rsplit(" ", 1)[0] + "…"
    ingredients = "; ".join(f"{i.quantity or ''} {i.name}".strip() for i in recipe.ingredients)
    return (
        f"Receita \"{recipe.title}\".\n"
        f"Ingredientes: {ingredients or 'não informados'}.\n"
        f"Modo de preparo: {instructions}"
    )


def find_recipes(db: Session, question: str, limit: int = 3) -> List[Tuple[float, Recipe]]:
    """Receitas cujo título aparece na pergunta, com a cobertura do título (0 a 1).

    Cobertura = fração das palavras do título presentes na pergunta (sem acentos).
    """
    words = tokenize(question)
    if not words:
        return []
    scored = []
    for id_, title in db.query(Recipe.id, Recipe.title):
        title_words = tokenize(title)
        matched = len(words & title_words)
        if matched:
            scored.append((matched / len(title_words), matched, id_))
    best = sorted(scored, reverse=True)[:limit]
    return [(coverage, db.get(Recipe, id_)) for coverage, _, id_ in best]


def find_cited_recipe(db: Session, text: str) -> Optional[Recipe]:
    """A receita cujo nome foi citado no texto (ex.: "quero fazer bolo Matilda"), se houver."""
    matches = find_recipes(db, text, limit=1)
    return matches[0][1] if matches and matches[0][0] >= STRONG_MATCH else None


PARTIAL_MATCH = 0.5  # metade do nome citada basta, se nenhuma outra receita casar com tantas palavras


def search_requested_recipe(db: Session, text: str) -> Tuple[Optional[Recipe], List[Recipe]]:
    """Receita pedida por voz ou texto: (a escolhida, ou None + as opções quando o pedido é ambíguo).

    Escolhe a receita quando o nome foi citado (>= STRONG_MATCH) ou quando pelo menos metade do nome
    foi citada e nenhuma outra receita casa com o mesmo número de palavras do pedido
    ("nordestino" → Cuscuz nordestino; "pudim" → opções, pois há dois pudins).
    """
    words = tokenize(text)
    candidates = []
    for id_, title in db.query(Recipe.id, Recipe.title):
        title_words = tokenize(title)
        matched = len(words & title_words)
        if matched:
            candidates.append((matched, matched / len(title_words), id_))
    if not candidates:
        return None, []
    candidates.sort(reverse=True)
    matched, coverage, best_id = candidates[0]
    runner_up = candidates[1] if len(candidates) > 1 else None
    beats_runner_up = runner_up is None or runner_up[:2] < (matched, coverage)
    distinct = runner_up is None or runner_up[0] < matched
    if (coverage >= STRONG_MATCH and beats_runner_up) or (coverage >= PARTIAL_MATCH and distinct):
        return db.get(Recipe, best_id), []
    return None, [db.get(Recipe, id_) for _, _, id_ in candidates[:5]]


def _system_author(db: Session) -> User:
    author = db.query(User).filter_by(email=BOOK_AUTHOR_EMAIL).first()
    if author is None:
        author = User(
            email=BOOK_AUTHOR_EMAIL,
            username="souschef",
            full_name="SousChef",
            hashed_password=get_password_hash(secrets.token_urlsafe(32)),
        )
        db.add(author)
        db.flush()
    return author


def _load_seed() -> List[RecipeCreate]:
    return [
        RecipeCreate.model_validate(item)
        for file in sorted(SEED_DIR.glob("*.json"))
        for item in json.loads(file.read_text(encoding="utf-8"))
    ]


def seed_recipes(db: Session) -> int:
    """Sincroniza as receitas do autor SousChef com os JSON: cria as novas e atualiza as alteradas.

    Retorna quantas receitas foram criadas ou atualizadas. Receitas de usuários e receitas do livro
    personalizadas por usuários não são tocadas.
    """
    author = _system_author(db)
    existing = {r.title: r for r in db.query(Recipe).filter(Recipe.user_id == author.id)}
    changed = 0
    for data in _load_seed():
        recipe = existing.get(data.title)
        if recipe is None:
            db.add(build_recipe(data, author.id))
        elif recipe.customized:
            continue
        elif RecipeCreate.model_validate(recipe, from_attributes=True) != data:
            for field, value in data.model_dump(exclude={"ingredients"}).items():
                setattr(recipe, field, value)
            recipe.ingredients = [Ingredient(**i.model_dump()) for i in data.ingredients]
        else:
            continue
        changed += 1
    db.commit()
    return changed

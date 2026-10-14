from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.database.connection import get_db
from app.models.favorite import Favorite
from app.models.recipe import Ingredient, Recipe
from app.models.user import User
from app.routes.auth import get_current_user
from app.schemas import (
    CountryCount,
    Difficulty,
    RecipeCreate,
    RecipeOut,
    RecipeUpdate,
    SyncSnapshot,
)
from app.services.recipes import build_recipe

router = APIRouter()


def get_recipe_or_404(db: Session, recipe_id: int) -> Recipe:
    recipe = db.get(Recipe, recipe_id)
    if recipe is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Receita não encontrada")
    return recipe


def _get_owned_recipe(db: Session, recipe_id: int, user: User) -> Recipe:
    recipe = get_recipe_or_404(db, recipe_id)
    if recipe.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Sem permissão para alterar esta receita")
    return recipe


def _as_utc(moment: datetime) -> datetime:
    return moment.replace(tzinfo=timezone.utc) if moment.tzinfo is None else moment.astimezone(timezone.utc)


def _server_is_newer(recipe: Recipe, client_updated_at: Optional[datetime]) -> bool:
    """A versão do servidor foi salva depois da edição feita no celular."""
    return bool(client_updated_at and recipe.updated_at and _as_utc(recipe.updated_at) > _as_utc(client_updated_at))


def _get_editable_recipe(db: Session, recipe_id: int, user: User) -> Recipe:
    """Receitas próprias ou do livro de receitas podem ser editadas."""
    recipe = get_recipe_or_404(db, recipe_id)
    if recipe.user_id != user.id and not recipe.from_book:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Sem permissão para alterar esta receita")
    return recipe


@router.get("/", response_model=List[RecipeOut])
def list_recipes(
    skip: int = 0,
    limit: int = Query(50, le=100),
    search: Optional[str] = None,
    difficulty: Optional[Difficulty] = None,
    country: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Recipe)
    if search:
        pattern = f"%{search}%"
        query = query.filter(Recipe.title.ilike(pattern) | Recipe.description.ilike(pattern))
    if difficulty:
        query = query.filter(Recipe.difficulty == difficulty)
    if country:
        query = query.filter(Recipe.country == country)
    if user_id:
        query = query.filter(Recipe.user_id == user_id)
    return query.order_by(Recipe.id.desc()).offset(skip).limit(limit).all()


@router.get("/sync", response_model=SyncSnapshot)
def sync_snapshot(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Todas as receitas e os favoritos do usuário, para o banco local do celular."""
    recipes = db.query(Recipe).options(selectinload(Recipe.ingredients), selectinload(Recipe.user)).all()
    favorite_ids = [recipe_id for (recipe_id,) in db.query(Favorite.recipe_id).filter_by(user_id=current_user.id)]
    return SyncSnapshot(server_time=datetime.now(timezone.utc), recipes=recipes, favorite_ids=favorite_ids)


@router.get("/countries", response_model=List[CountryCount])
def list_countries(db: Session = Depends(get_db)):
    """Países de criação com receitas cadastradas, do que tem mais receitas para o que tem menos."""
    rows = (
        db.query(Recipe.country, func.count(Recipe.id))
        .filter(Recipe.country.isnot(None))
        .group_by(Recipe.country)
        .order_by(func.count(Recipe.id).desc(), Recipe.country)
        .all()
    )
    return [CountryCount(country=country, recipe_count=count) for country, count in rows]


@router.post("/", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def create_recipe(
    data: RecipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.client_ref:  # reenvio de uma criação offline: devolve a receita já criada
        existing = db.query(Recipe).filter_by(client_ref=data.client_ref, user_id=current_user.id).first()
        if existing:
            return existing
    recipe = build_recipe(data, current_user.id)
    if data.client_updated_at:  # criada offline: vale o horário em que foi feita
        recipe.updated_at = data.client_updated_at
    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.get("/{recipe_id}", response_model=RecipeOut)
def read_recipe(recipe_id: int, db: Session = Depends(get_db)):
    return get_recipe_or_404(db, recipe_id)


@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(
    recipe_id: int,
    data: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipe = _get_editable_recipe(db, recipe_id, current_user)
    if _server_is_newer(recipe, data.client_updated_at):  # última alteração vence
        return recipe
    recipe.customized = recipe.from_book
    # Horário em que a alteração foi feita (no celular, se veio de lá): base da regra
    # "última alteração vence". Marca a edição mesmo quando só os ingredientes mudam.
    recipe.updated_at = data.client_updated_at or func.now()
    changes = data.model_dump(exclude_unset=True, exclude={"ingredients", "client_updated_at"})
    for field, value in changes.items():
        setattr(recipe, field, value)
    if data.ingredients is not None:
        recipe.ingredients = [Ingredient(**i.model_dump()) for i in data.ingredients]
    db.commit()
    db.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.delete(_get_owned_recipe(db, recipe_id, current_user))
    db.commit()

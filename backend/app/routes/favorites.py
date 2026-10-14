from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.favorite import Favorite
from app.models.recipe import Recipe
from app.models.user import User
from app.routes.auth import get_current_user
from app.routes.recipes import get_recipe_or_404
from app.schemas import FavoriteIn, RecipeOut

router = APIRouter()


def _find(db: Session, user_id: int, recipe_id: int):
    return db.query(Favorite).filter_by(user_id=user_id, recipe_id=recipe_id).first()


@router.get("/", response_model=List[RecipeOut])
def list_favorites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Recipe)
        .join(Favorite, Favorite.recipe_id == Recipe.id)
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.id.desc())
        .all()
    )


@router.get("/ids", response_model=List[int])
def list_favorite_ids(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Favorite.recipe_id).filter_by(user_id=current_user.id).all()
    return [recipe_id for (recipe_id,) in rows]


@router.post("/", status_code=status.HTTP_204_NO_CONTENT)
def add_favorite(
    data: FavoriteIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    get_recipe_or_404(db, data.recipe_id)
    if not _find(db, current_user.id, data.recipe_id):  # idempotente
        db.add(Favorite(user_id=current_user.id, recipe_id=data.recipe_id))
        db.commit()


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    favorite = _find(db, current_user.id, recipe_id)
    if favorite is not None:  # idempotente: reenvio de uma remoção feita offline
        db.delete(favorite)
        db.commit()

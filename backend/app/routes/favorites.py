from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.favorite import Favorite
from app.models.recipe import Recipe
from app.models.user import User
from app.routes.auth import get_current_user

router = APIRouter()

# Modelos Pydantic
class FavoriteCreate(BaseModel):
    recipe_id: int

class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    recipe_id: int
    created_at: str
    
    class Config:
        from_attributes = True

# Endpoints
@router.post("/", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    favorite_data: FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adiciona uma receita aos favoritos.
    """
    # Verifica se a receita existe
    recipe = db.query(Recipe).filter(Recipe.id == favorite_data.recipe_id).first()
    
    if recipe is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    # Verifica se já está nos favoritos
    existing_favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.recipe_id == favorite_data.recipe_id
    ).first()
    
    if existing_favorite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipe already in favorites"
        )
    
    # Cria favorito
    db_favorite = Favorite(
        user_id=current_user.id,
        recipe_id=favorite_data.recipe_id
    )
    
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    
    return db_favorite

@router.get("/", response_model=List[dict])
async def read_favorites(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna receitas favoritas do usuário atual.
    """
    favorites = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    # Busca informações das receitas
    result = []
    for favorite in favorites:
        recipe = db.query(Recipe).filter(Recipe.id == favorite.recipe_id).first()
        if recipe:
            result.append({
                "favorite_id": favorite.id,
                "created_at": str(favorite.created_at),
                "recipe": {
                    "id": recipe.id,
                    "title": recipe.title,
                    "description": recipe.description,
                    "difficulty": recipe.difficulty,
                    "prep_time": recipe.prep_time,
                    "cook_time": recipe.cook_time
                }
            })
    
    return result

@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove uma receita dos favoritos.
    """
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.recipe_id == recipe_id
    ).first()
    
    if favorite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    
    return None

@router.get("/check/{recipe_id}")
async def check_favorite(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verifica se uma receita está nos favoritos.
    """
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.recipe_id == recipe_id
    ).first()
    
    return {"is_favorite": favorite is not None}

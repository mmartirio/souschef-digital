from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.recipe import Recipe
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter()

# Modelo simplificado de categoria (pode ser expandido depois)
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    recipe_count: int = 0
    
    class Config:
        from_attributes = True

# Por enquanto, vamos usar categorias estáticas baseadas em dificuldade
# Poderia ser expandido para um modelo de banco de dados separado
STATIC_CATEGORIES = [
    {"id": 1, "name": "Fáceis", "description": "Receitas rápidas e simples", "difficulty": "easy"},
    {"id": 2, "name": "Médias", "description": "Receitas de dificuldade intermediária", "difficulty": "medium"},
    {"id": 3, "name": "Difíceis", "description": "Receitas complexas e elaboradas", "difficulty": "hard"},
]

@router.get("/", response_model=List[dict])
async def read_categories(
    db: Session = Depends(get_db)
):
    """
    Retorna lista de categorias com contagem de receitas.
    """
    categories = []
    
    for category in STATIC_CATEGORIES:
        # Conta receitas por dificuldade
        count = db.query(Recipe).filter(
            Recipe.difficulty == category["difficulty"]
        ).count()
        
        categories.append({
            "id": category["id"],
            "name": category["name"],
            "description": category["description"],
            "recipe_count": count
        })
    
    return categories

@router.get("/{category_id}/recipes")
async def read_category_recipes(
    category_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retorna receitas de uma categoria específica.
    """
    # Encontra categoria
    category = next((c for c in STATIC_CATEGORIES if c["id"] == category_id), None)
    
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Busca receitas
    recipes = db.query(Recipe).filter(
        Recipe.difficulty == category["difficulty"]
    ).offset(skip).limit(limit).all()
    
    return {
        "category": category,
        "recipes": recipes
    }

@router.get("/stats")
async def read_category_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas de categorias para o usuário.
    """
    stats = []
    
    for category in STATIC_CATEGORIES:
        # Conta receitas do usuário por categoria
        user_count = db.query(Recipe).filter(
            Recipe.user_id == current_user.id,
            Recipe.difficulty == category["difficulty"]
        ).count()
        
        # Conta total de receitas na categoria
        total_count = db.query(Recipe).filter(
            Recipe.difficulty == category["difficulty"]
        ).count()
        
        stats.append({
            "category": category["name"],
            "user_recipes": user_count,
            "total_recipes": total_count
        })
    
    return stats

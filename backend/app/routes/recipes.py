from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.connection import get_db
from app.models.recipe import Recipe, Ingredient
from app.models.user import User
from app.routes.auth import get_current_user

router = APIRouter()

# Modelos Pydantic
class IngredientCreate(BaseModel):
    name: str
    quantity: str

class IngredientResponse(BaseModel):
    id: int
    name: str
    quantity: str
    recipe_id: int
    
    class Config:
        from_attributes = True

class RecipeCreate(BaseModel):
    title: str
    description: Optional[str] = None
    instructions: str
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    difficulty: Optional[str] = None
    ingredients: List[IngredientCreate] = []

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    difficulty: Optional[str] = None
    ingredients: Optional[List[IngredientCreate]] = None

class RecipeResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    instructions: str
    prep_time: Optional[int]
    cook_time: Optional[int]
    servings: Optional[int]
    difficulty: Optional[str]
    user_id: int
    ingredients: List[IngredientResponse] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        from_attributes = True

# Endpoints
@router.post("/", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe_data: RecipeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria uma nova receita.
    """
    # Valida dificuldade se fornecida
    if recipe_data.difficulty and recipe_data.difficulty not in ['easy', 'medium', 'hard']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Difficulty must be 'easy', 'medium', or 'hard'"
        )
    
    # Cria receita
    db_recipe = Recipe(
        title=recipe_data.title,
        description=recipe_data.description,
        instructions=recipe_data.instructions,
        prep_time=recipe_data.prep_time,
        cook_time=recipe_data.cook_time,
        servings=recipe_data.servings,
        difficulty=recipe_data.difficulty,
        user_id=current_user.id
    )
    
    db.add(db_recipe)
    db.commit()
    db.refresh(db_recipe)
    
    # Adiciona ingredientes
    for ingredient_data in recipe_data.ingredients:
        ingredient = Ingredient(
            name=ingredient_data.name,
            quantity=ingredient_data.quantity,
            recipe_id=db_recipe.id
        )
        db.add(ingredient)
    
    db.commit()
    db.refresh(db_recipe)
    
    return db_recipe

@router.get("/", response_model=List[RecipeResponse])
async def read_recipes(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(None, description="Search in title and description"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    user_id: Optional[int] = Query(None, description="Filter by user"),
    db: Session = Depends(get_db)
):
    """
    Retorna lista de receitas com filtros opcionais.
    """
    query = db.query(Recipe)
    
    # Aplica filtros
    if search:
        query = query.filter(
            (Recipe.title.ilike(f"%{search}%")) | 
            (Recipe.description.ilike(f"%{search}%"))
        )
    
    if difficulty:
        query = query.filter(Recipe.difficulty == difficulty)
    
    if user_id:
        query = query.filter(Recipe.user_id == user_id)
    
    recipes = query.offset(skip).limit(limit).all()
    return recipes

@router.get("/{recipe_id}", response_model=RecipeResponse)
async def read_recipe(
    recipe_id: int,
    db: Session = Depends(get_db)
):
    """
    Retorna uma receita específica por ID.
    """
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    
    if recipe is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    return recipe

@router.put("/{recipe_id}", response_model=RecipeResponse)
async def update_recipe(
    recipe_id: int,
    recipe_update: RecipeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza uma receita existente.
    """
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    
    if recipe is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    # Verifica se o usuário é o dono da receita
    if recipe.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this recipe"
        )
    
    # Atualiza campos
    update_data = recipe_update.dict(exclude_unset=True)
    
    # Se há ingredientes para atualizar, remove os antigos
    if "ingredients" in update_data and update_data["ingredients"] is not None:
        # Remove ingredientes antigos
        db.query(Ingredient).filter(Ingredient.recipe_id == recipe_id).delete()
        
        # Adiciona novos ingredientes
        for ingredient_data in update_data["ingredients"]:
            ingredient = Ingredient(
                name=ingredient_data["name"],
                quantity=ingredient_data["quantity"],
                recipe_id=recipe_id
            )
            db.add(ingredient)
        
        update_data.pop("ingredients")
    
    # Atualiza outros campos
    for field, value in update_data.items():
        if value is not None:
            setattr(recipe, field, value)
    
    db.commit()
    db.refresh(recipe)
    
    return recipe

@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deleta uma receita.
    """
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    
    if recipe is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )
    
    # Verifica se o usuário é o dono da receita
    if recipe.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this recipe"
        )
    
    db.delete(recipe)
    db.commit()
    
    return None

@router.get("/user/me", response_model=List[RecipeResponse])
async def read_my_recipes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna receitas do usuário atual.
    """
    recipes = db.query(Recipe).filter(
        Recipe.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return recipes

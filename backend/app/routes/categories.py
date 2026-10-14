from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.recipe import Recipe
from app.schemas import CategoryOut

router = APIRouter()

# Categorias derivadas da dificuldade; filtre receitas com GET /recipes?difficulty=...
CATEGORIES = [
    (1, "Fáceis", "Receitas rápidas e simples", "easy"),
    (2, "Médias", "Receitas de dificuldade intermediária", "medium"),
    (3, "Difíceis", "Receitas complexas e elaboradas", "hard"),
]


@router.get("/", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    counts = dict(
        db.query(Recipe.difficulty, func.count(Recipe.id)).group_by(Recipe.difficulty).all()
    )
    return [
        CategoryOut(id=id_, name=name, description=desc, difficulty=diff, recipe_count=counts.get(diff, 0))
        for id_, name, desc, diff in CATEGORIES
    ]

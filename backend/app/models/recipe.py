from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from app.database.connection import Base

class Recipe(Base):
    """Modelo de receita para o sistema."""
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    instructions = Column(String, nullable=False)
    prep_time = Column(Integer, nullable=True)  # tempo de preparo em minutos
    cook_time = Column(Integer, nullable=True)  # tempo de cozimento em minutos
    servings = Column(Integer, nullable=True)   # número de porções
    difficulty = Column(String, nullable=True)  # nível de dificuldade
    user_id = Column(Integer, nullable=False)  # ID do usuário que criou a receita


    # Relacionamento com o modelo User (autor da receita)
    user = relationship("User")
    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), default=datetime.utcnow)

class Ingredient(Base):
    """Modelo de ingrediente para o sistema."""
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    quantity = Column(String, nullable=True)  # quantidade como string (ex: "2 xícaras", "1 colher de sopa")
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)

    # Relacionamento com o modelo Recipe
    recipe = relationship("Recipe", back_populates="ingredients")
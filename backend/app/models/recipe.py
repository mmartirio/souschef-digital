from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import false, func
from app.database.connection import Base
from app.models.user import BOOK_AUTHOR_EMAIL

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
    difficulty = Column(String, nullable=True)  # easy | medium | hard
    country = Column(String, nullable=True, index=True)  # país de criação do prato
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # autor da receita
    # Id gerado no celular para receitas criadas offline: reenvios não duplicam a receita.
    client_ref = Column(String, nullable=True, unique=True, index=True)
    # Receita do livro alterada por um usuário: a sincronização do seed não a sobrescreve.
    customized = Column(Boolean, nullable=False, default=False, server_default=false())

    # Relacionamento com o modelo User (autor da receita)
    user = relationship("User")
    ingredients = relationship("Ingredient", back_populates="recipe", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="recipe", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @property
    def from_book(self) -> bool:
        """Receita do livro inicial (autor SousChef)."""
        return self.user is not None and self.user.email == BOOK_AUTHOR_EMAIL


class Ingredient(Base):
    """Modelo de ingrediente para o sistema."""
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    quantity = Column(String, nullable=True)  # quantidade como string (ex: "2 xícaras", "1 colher de sopa")
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)

    # Relacionamento com o modelo Recipe
    recipe = relationship("Recipe", back_populates="ingredients")

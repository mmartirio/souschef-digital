from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class Favorite(Base):
    """Modelo de favoritos para o sistema."""
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    user = relationship("User")
    recipe = relationship("Recipe")

    def __repr__(self):
        return f"<Favorite(user_id={self.user_id}, recipe_id={self.recipe_id})>"

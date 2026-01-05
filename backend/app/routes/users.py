from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr

from app.database.connection import get_db
from app.models.user import User
from app.routes.auth import get_current_user
from app.utils.security import get_password_hash

router = APIRouter()

# Modelos
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    created_at: str
    
    class Config:
        from_attributes = True

# Endpoints
@router.get("/", response_model=List[UserProfileResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna lista de usuários (apenas para admin no futuro).
    """
    # TODO: Adicionar verificação de admin
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserProfileResponse)
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna informações de um usuário específico.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.put("/me", response_model=UserProfileResponse)
async def update_user_me(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza informações do usuário atual.
    """
    update_data = user_update.dict(exclude_unset=True)
    
    # Verifica se quer atualizar senha
    if "new_password" in update_data:
        if "current_password" not in update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to change password"
            )
        
        from app.utils.security import verify_password
        if not verify_password(update_data["current_password"], current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Atualiza senha
        current_user.hashed_password = get_password_hash(update_data["new_password"])
        update_data.pop("new_password")
        update_data.pop("current_password")
    
    # Atualiza outros campos
    for field, value in update_data.items():
        if value is not None:
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Desativa conta do usuário atual (soft delete).
    """
    current_user.is_active = False
    db.commit()
    
    return None
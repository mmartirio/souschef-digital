import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.favorite import Favorite
from app.models.recipe import Recipe
from app.models.user import User
from app.routes.auth import get_current_user
from app.schemas import UserOut, UserUpdate
from app.utils.security import get_password_hash, verify_password
from app.utils.uploads import read_limited

router = APIRouter()
media_router = APIRouter()

MEDIA_DIR = Path(os.getenv("MEDIA_DIR", "./media"))
MEDIA_URL = "/media"
AVATAR_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024


def _remove_avatar_file(user: User) -> None:
    if user.avatar_url:
        (MEDIA_DIR / Path(user.avatar_url).name).unlink(missing_ok=True)


@router.put("/me", response_model=UserOut)
def update_me(
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.new_password:
        if not data.current_password or not verify_password(
            data.current_password, current_user.hashed_password
        ):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Senha atual incorreta")
        current_user.hashed_password = get_password_hash(data.new_password)

    if data.full_name is not None:
        current_user.full_name = data.full_name.strip() or None

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/me/avatar", response_model=UserOut)
async def update_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    extension = AVATAR_TYPES.get(file.content_type or "")
    if extension is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Envie uma imagem JPG, PNG ou WebP")
    content = await read_limited(file, MAX_AVATAR_BYTES, "Imagem maior que 5 MB")

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"avatar_{current_user.id}_{uuid.uuid4().hex}.{extension}"
    (MEDIA_DIR / filename).write_bytes(content)

    _remove_avatar_file(current_user)
    current_user.avatar_url = f"{MEDIA_URL}/{filename}"
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Exclui a conta e os dados do usuário (receitas, favoritos e foto)."""
    db.query(Favorite).filter_by(user_id=current_user.id).delete()
    for recipe in db.query(Recipe).filter_by(user_id=current_user.id):
        db.delete(recipe)  # cascade remove ingredientes e favoritos de outros usuários
    _remove_avatar_file(current_user)
    db.delete(current_user)
    db.commit()


@media_router.get("/{filename}")
def own_media(filename: str, current_user: User = Depends(get_current_user)):
    """Foto de perfil: só o próprio usuário acessa (o nome começa com avatar_<id>_)."""
    path = MEDIA_DIR / Path(filename).name
    if not filename.startswith(f"avatar_{current_user.id}_") or not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Arquivo não encontrado")
    return FileResponse(path)

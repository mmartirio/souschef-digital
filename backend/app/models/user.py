from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: Optional[str] = None
    email: str
    name: Optional[str] = None

from pydantic import BaseModel
from typing import List, Optional

class Recipe(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    category: str
    user_id: str

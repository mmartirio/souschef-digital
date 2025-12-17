from pydantic import BaseModel

class AIRequest(BaseModel):
    prompt: str
    context: str = ""

from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    requires_human_support: bool
    crisis_resources: dict | None = None
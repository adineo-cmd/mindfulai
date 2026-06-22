from pydantic import BaseModel, Field

class TextAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="The text snippet to analyze")

class TextAnalyzeResponse(BaseModel):
    emotion_label: str
    confidence: float
    sentiment_polarity: float
    all_scores: dict[str, float]

class FacialAnalyzeRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image string")

class FacialAnalyzeResponse(BaseModel):
    emotion_label: str | None = None
    confidence: float | None = None
    message: str = "Analysis complete"
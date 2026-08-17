from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.text_emotion_record import TextEmotionRecord
from app.schemas.emotion import TextAnalyzeRequest, TextAnalyzeResponse
from app.services.text_emotion_service import text_emotion_service

router = APIRouter(prefix="/api/text-emotion", tags=["text-emotion"])

@router.post("/analyze", response_model=TextAnalyzeResponse)
def analyze_text(
    request: TextAnalyzeRequest, 
    user_id: int = Query(default=1),  # Dynamic user ID from frontend
    db: Session = Depends(get_db)
):
    """
    Analyzes a text snippet for emotion and sentiment.
    Stores the derived metrics in the database for analytics.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        # 1. Run ML Inference (HuggingFace + VADER)
        result = text_emotion_service.predict(request.text)

        # 2. Save to Database
        record = TextEmotionRecord(
            user_id=user_id,
            text_snippet=request.text[:200], 
            emotion_label=result["emotion_label"],
            confidence=result["confidence"],
            sentiment_polarity=result["sentiment_polarity"]
        )
        db.add(record)
        db.commit()

        # 3. Return results to frontend
        return TextAnalyzeResponse(**result)
        
    except Exception as e:
        db.rollback() # Rollback if anything failed
        print(f"Text emotion error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze text")
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.facial_emotion_record import FacialEmotionRecord
from app.models.consent_record import ConsentRecord
from app.schemas.emotion import FacialAnalyzeRequest, FacialAnalyzeResponse
from app.services.facial_emotion_service import facial_emotion_service
from app.core.exceptions import ConsentRequiredException
# from app.api.deps import get_current_user # Uncomment in production

router = APIRouter(prefix="/api/facial-emotion", tags=["facial-emotion"])

@router.post("/analyze", response_model=FacialAnalyzeResponse)
def analyze_facial_emotion(request: FacialAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Analyzes a single base64 image for facial emotion.
    STRICT PRIVACY: The raw image is processed in-memory and NEVER saved to the database.
    """
    # user = get_current_user()
    user_id = 1  # Mock user ID for template

    # 1. STRICT PRIVACY CHECK: Verify explicit user consent for camera processing
    consent = db.query(ConsentRecord).filter(ConsentRecord.user_id == user_id).first()
    if not consent or not consent.camera_consent:
        raise ConsentRequiredException("facial emotion analysis")

    # 2. Run ML Inference (OpenCV Face Detection + ViT Classification)
    # The image is processed in-memory. No frames are saved.
    result = facial_emotion_service.predict(request.image_base64)

    if result is None:
        return FacialAnalyzeResponse(
            message="No face detected in the image. Please ensure your face is clearly visible and well-lit."
        )

    # 3. Save ONLY the derived metadata to the database
    record = FacialEmotionRecord(
        user_id=user_id,
        emotion_label=result["emotion_label"],
        confidence=result["confidence"]
    )
    db.add(record)
    db.commit()

    # 4. Return results to frontend
    return FacialAnalyzeResponse(
        emotion_label=result["emotion_label"],
        confidence=round(result["confidence"], 3),
        message="Analysis complete"
    )
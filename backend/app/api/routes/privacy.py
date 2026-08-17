from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import mood_log, text_emotion_record, facial_emotion_record, consent_record
from app.schemas.privacy import ConsentUpdate

# FIX: Changed prefix from /api/user to /api/privacy
router = APIRouter(prefix="/api/privacy", tags=["privacy"])

# --- ADDED: Endpoint to GET current consent preferences ---
@router.get("/consent")
def get_consent(
    user_id: int = Query(default=1),  # Dynamic user ID from frontend
    db: Session = Depends(get_db)
):
    """Get current consent preferences for user."""
    consent = db.query(consent_record.ConsentRecord).filter(
        consent_record.ConsentRecord.user_id == user_id
    ).first()
    
    if not consent:
        # Create default consent record if none exists
        consent = consent_record.ConsentRecord(
            user_id=user_id,
            camera_consent=True,
            text_consent=True,
            analytics_consent=False
        )
        db.add(consent)
        db.commit()
        db.refresh(consent)
    
    return {
        "status": "success",
        "data": {
            "camera_consent": consent.camera_consent,
            "text_consent": consent.text_consent,
            "analytics_consent": consent.analytics_consent
        }
    }

# --- UPDATE: Changed path from /consent to just use the router prefix ---
@router.put("/consent")
def update_consent(
    consent_data: ConsentUpdate, 
    user_id: int = Query(default=1),  # Dynamic user ID from frontend
    db: Session = Depends(get_db)
):
    """Update user consent preferences for camera, text, and analytics."""
    consent = db.query(consent_record.ConsentRecord).filter(
        consent_record.ConsentRecord.user_id == user_id
    ).first()
    
    if not consent:
        consent = consent_record.ConsentRecord(user_id=user_id)
        db.add(consent)
        db.flush()

    if consent_data.camera_consent is not None:
        consent.camera_consent = consent_data.camera_consent
    if consent_data.text_consent is not None:
        consent.text_consent = consent_data.text_consent
    if consent_data.analytics_consent is not None:
        consent.analytics_consent = consent_data.analytics_consent
        
    db.commit()
    db.refresh(consent)
    
    return {
        "status": "success",
        "message": "Consent preferences updated successfully",
        "data": {
            "camera_consent": consent.camera_consent,
            "text_consent": consent.text_consent,
            "analytics_consent": consent.analytics_consent
        }
    }

@router.delete("/data")
def delete_my_data(
    user_id: int = Query(default=1),  # Dynamic user ID from frontend
    db: Session = Depends(get_db)
):
    """GDPR-style right to erasure. Deletes all user data."""
    # Note: Removed chat_message deletion since the chat feature was removed
    
    db.query(mood_log.MoodLog).filter(mood_log.MoodLog.user_id == user_id).delete()
    db.query(text_emotion_record.TextEmotionRecord).filter(
        text_emotion_record.TextEmotionRecord.user_id == user_id
    ).delete()
    db.query(facial_emotion_record.FacialEmotionRecord).filter(
        facial_emotion_record.FacialEmotionRecord.user_id == user_id
    ).delete()
    db.query(consent_record.ConsentRecord).filter(
        consent_record.ConsentRecord.user_id == user_id
    ).delete()
    
    db.commit()
    return {"status": "success", "message": "All personal data has been permanently deleted."}

@router.get("/export")
def export_data(
    format: str = "json", 
    user_id: int = Query(default=1),  # Dynamic user ID from frontend
    db: Session = Depends(get_db)
):
    """Export user data (simplified JSON export for demo)."""
    logs = db.query(mood_log.MoodLog).filter(mood_log.MoodLog.user_id == user_id).all()
    records = [{"date": log.created_at, "mood": log.mood_score, "note": log.note} for log in logs]
    
    return {"format": format, "records": records}
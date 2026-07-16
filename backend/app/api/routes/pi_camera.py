from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.db.session import get_db
from app.models.facial_emotion_record import FacialEmotionRecord

router = APIRouter(prefix="/api/pi-camera", tags=["pi-camera"])

@router.get("/latest")
def get_latest_pi_emotion(db: Session = Depends(get_db)):
    """Get the most recent emotion detected by the Raspberry Pi"""
    # Fetch the latest record from the last 5 minutes
    time_threshold = datetime.utcnow() - timedelta(minutes=5)
    
    latest_record = db.query(FacialEmotionRecord).filter(
        FacialEmotionRecord.created_at >= time_threshold
    ).order_by(
        FacialEmotionRecord.created_at.desc()
    ).first()
    
    if not latest_record:
        return {
            "status": "success",
            "data": {
                "emotion": "Waiting for Pi Camera...",
                "confidence": 0.0,
                "timestamp": None,
                "is_active": False
            }
        }
    
    return {
        "status": "success",
        "data": {
            "emotion": latest_record.emotion_label,
            "confidence": round(latest_record.confidence, 2),
            "timestamp": latest_record.created_at.isoformat(),
            "is_active": True
        }
    }

@router.get("/status")
def get_pi_camera_status(db: Session = Depends(get_db)):
    """Check if the Raspberry Pi camera is actively streaming"""
    # Check if there's been activity in the last 2 minutes
    time_threshold = datetime.utcnow() - timedelta(minutes=2)
    
    recent_activity = db.query(FacialEmotionRecord).filter(
        FacialEmotionRecord.created_at >= time_threshold
    ).count()
    
    return {
        "status": "success",
        "data": {
            "is_streaming": recent_activity > 0,
            "recent_detections": recent_activity,
            "last_activity_threshold": "2 minutes"
        }
    }
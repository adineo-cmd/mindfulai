from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.mood_log import MoodLog
from app.schemas.mood_log import MoodLogCreate, MoodLogResponse
from typing import List

router = APIRouter(prefix="/api/journal", tags=["journal"])

@router.post("", response_model=MoodLogResponse)
async def create_log(
    log: MoodLogCreate, 
    user_id: int = Query(default=1),  # Dynamic user ID from frontend
    db: Session = Depends(get_db)
):
    """Create a new mood/journal entry"""
    try:
        db_log = MoodLog(
            user_id=user_id,
            mood_score=log.mood_score,
            note=log.note,
            sleep_hours=log.sleep_hours,
            screen_time=log.screen_time,
            activity_level=log.activity_level
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log
    except Exception as e:
        print(f"Journal error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# FIX: Changed "/" to "" to prevent 307 redirects
@router.get("", response_model=List[MoodLogResponse])
async def get_logs(
    user_id: int = Query(default=1),  # Dynamic user ID from frontend
    db: Session = Depends(get_db)
):
    """Get all journal entries for current user"""
    logs = db.query(MoodLog).filter(
        MoodLog.user_id == user_id
    ).order_by(MoodLog.created_at.desc()).all()
    return logs
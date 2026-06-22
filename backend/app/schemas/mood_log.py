from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MoodLogCreate(BaseModel):
    mood_score: int
    note: Optional[str] = None
    sleep_hours: Optional[float] = None
    screen_time: Optional[float] = None
    activity_level: Optional[str] = None

class MoodLogResponse(MoodLogCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class TextEmotionRecord(Base):
    __tablename__ = "text_emotion_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text_snippet = Column(String, nullable=False)
    emotion_label = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    sentiment_polarity = Column(Float, nullable=False) # -1 to 1
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

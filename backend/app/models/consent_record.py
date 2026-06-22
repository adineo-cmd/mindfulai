from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class ConsentRecord(Base):
    __tablename__ = "consent_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    camera_consent = Column(Boolean, default=False)
    text_consent = Column(Boolean, default=False)
    analytics_consent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
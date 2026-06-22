from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Float
from sqlalchemy.sql import func
from app.db.base import Base

class ExternalSource(Base):
    __tablename__ = "external_sources"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_type = Column(String, nullable=False)  # 'google_keep', 'notion', 'email', 'apple_notes'
    source_name = Column(String, nullable=False)
    is_connected = Column(Boolean, default=False)
    access_token = Column(Text, nullable=True)  # Encrypted in production
    last_sync = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ImportedNote(Base):
    __tablename__ = "imported_notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_id = Column(Integer, ForeignKey("external_sources.id"), nullable=False)
    external_id = Column(String, nullable=False)  # ID from external service
    content = Column(Text, nullable=False)
    title = Column(String, nullable=True)
    created_at_external = Column(DateTime(timezone=True), nullable=True)
    imported_at = Column(DateTime(timezone=True), server_default=func.now())
    sentiment_score = Column(Float, nullable=True)
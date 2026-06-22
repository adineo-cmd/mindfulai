from sqlalchemy.orm import Session, joinedload
from app.models.external_source import ExternalSource, ImportedNote
from app.services.text_emotion_service import text_emotion_service
from datetime import datetime, timezone
import requests

class ConnectorService:
    def __init__(self):
        self.supported_sources = {
            "google_keep": {"name": "Google Keep", "icon": "📝", "oauth_required": True},
            "notion": {"name": "Notion", "icon": "📓", "oauth_required": True},
            "email": {"name": "Email (Gmail)", "icon": "📧", "oauth_required": True},
            "apple_notes": {"name": "Apple Notes", "icon": "📝", "oauth_required": False},
            "obsidian": {"name": "Obsidian", "icon": "🗿", "oauth_required": False},
            "evernote": {"name": "Evernote", "icon": "🐘", "oauth_required": True}
        }
    
    def get_available_connectors(self) -> dict:
        return self.supported_sources
    
    def connect_source(self, db: Session, user_id: int, source_type: str, auth_code: str = None) -> dict:
        """Initiate connection to external source"""
        source = ExternalSource(
            user_id=user_id,
            source_type=source_type,
            source_name=self.supported_sources[source_type]["name"]
        )
        
        if source_type in ["google_keep", "notion", "email", "evernote"]:
            # OAuth flow - store token
            source.access_token = auth_code  # In production, exchange for proper token
            source.is_connected = True
        else:
            # Local sources - just mark as connected
            source.is_connected = True
        
        db.add(source)
        db.commit()
        db.refresh(source)
        
        return {
            "id": source.id,
            "source_type": source.source_type,
            "source_name": source.source_name,
            "is_connected": source.is_connected
        }
    
    def sync_notes(self, db: Session, user_id: int, source_id: int) -> dict:
        """Sync notes from external source"""
        source = db.query(ExternalSource).filter(
            ExternalSource.id == source_id,
            ExternalSource.user_id == user_id
        ).first()
        
        if not source or not source.is_connected:
            raise ValueError("Source not connected")
        
        # Mock sync - implement actual API calls for each service
        notes_to_import = self._fetch_external_notes(source)
        
        imported_count = 0
        for note_data in notes_to_import:
            # Check if already imported
            existing = db.query(ImportedNote).filter(
                ImportedNote.external_id == note_data["external_id"],
                ImportedNote.source_id == source_id
            ).first()
            
            if not existing:
                # Analyze sentiment
                sentiment = text_emotion_service.predict(note_data["content"])
                
                note = ImportedNote(
                    user_id=user_id,
                    source_id=source_id,
                    external_id=note_data["external_id"],
                    content=note_data["content"][:5000],  # Limit size
                    title=note_data.get("title"),
                    created_at_external=note_data.get("created_at"),
                    sentiment_score=sentiment["sentiment_polarity"]
                )
                db.add(note)
                imported_count += 1
        
        # FIX: Use timezone-aware UTC time
        source.last_sync = datetime.now(timezone.utc)
        db.commit()
        
        return {
            "imported_count": imported_count,
            "last_sync": source.last_sync
        }
    
    def _fetch_external_notes(self, source: ExternalSource) -> list:
        """Fetch notes from external service (implement per service)"""
        # This is a mock - implement actual API calls
        if source.source_type == "notion":
            return self._fetch_notion_pages(source.access_token)
        elif source.source_type == "google_keep":
            return self._fetch_google_keep_notes(source.access_token)
        # ... other services
        
        return []
    
    def _fetch_notion_pages(self, token: str) -> list:
        """Fetch pages from Notion API"""
        # Implement Notion API integration
        # https://developers.notion.com/
        return []
    
    def _fetch_google_keep_notes(self, token: str) -> list:
        """Fetch notes from Google Keep (via Google Takeout or unofficial API)"""
        # Google Keep doesn't have official API - use Google Takeout or third-party
        return []
    
    def get_imported_notes(self, db: Session, user_id: int, limit: int = 50) -> list:
        """Get imported notes with sentiment analysis"""
        # FIX: Use joinedload to eagerly load the source relationship
        notes = db.query(ImportedNote).options(
            joinedload(ImportedNote.source)
        ).filter(
            ImportedNote.user_id == user_id
        ).order_by(ImportedNote.imported_at.desc()).limit(limit).all()
        
        return [
            {
                "id": note.id,
                "title": note.title,
                "content": note.content[:200] + "..." if len(note.content) > 200 else note.content,
                "source": note.source.source_name,  # Now this will work!
                "sentiment": "positive" if note.sentiment_score > 0 else "negative" if note.sentiment_score < 0 else "neutral",
                "sentiment_score": note.sentiment_score,
                "created_at": note.created_at_external or note.imported_at
            }
            for note in notes
        ]

connector_service = ConnectorService()
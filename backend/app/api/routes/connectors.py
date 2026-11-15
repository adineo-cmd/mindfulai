from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.connector import ConnectorConnectRequest, ConnectorSyncRequest
from app.services.connector_service import connector_service
from app.models.external_source import ExternalSource

router = APIRouter(prefix="/api/connectors", tags=["connectors"])

@router.get("/available")
def get_available_connectors():
    """Get list of available external data sources"""
    return {"connectors": connector_service.get_available_connectors()}

@router.get("/sources")
def get_connected_sources(
    user_id: int = Query(default=1),
    db: Session = Depends(get_db)
):
    """Get all connected sources for current user"""
    sources = db.query(ExternalSource).filter(
        ExternalSource.user_id == user_id,
        ExternalSource.is_connected
    ).all()
    
    return {
        "sources": [
            {
                "id": source.id,
                "source_type": source.source_type,
                "source_name": source.source_name,
                "is_connected": source.is_connected,
                "last_sync": source.last_sync.isoformat() if source.last_sync else None
            }
            for source in sources
        ]
    }

@router.post("/connect")
def connect_source(
    request: ConnectorConnectRequest, 
    user_id: int = Query(default=1),
    db: Session = Depends(get_db)
):
    """Connect to an external data source"""
    result = connector_service.connect_source(
        db, user_id, request.source_type, request.auth_code
    )
    return result

@router.post("/sync")
def sync_source(
    request: ConnectorSyncRequest, 
    user_id: int = Query(default=1),
    db: Session = Depends(get_db)
):
    """Sync data from connected source"""
    result = connector_service.sync_notes(db, user_id, request.source_id)
    return result

@router.get("/notes")
def get_imported_notes(
    user_id: int = Query(default=1),
    db: Session = Depends(get_db)
):
    """Get all imported notes"""
    return {"notes": connector_service.get_imported_notes(db, user_id)}

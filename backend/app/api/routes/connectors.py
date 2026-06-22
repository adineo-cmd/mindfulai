from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.connector import ConnectorConnectRequest, ConnectorSyncRequest
from app.services.connector_service import connector_service

router = APIRouter(prefix="/api/connectors", tags=["connectors"])

@router.get("/available")
def get_available_connectors():
    """Get list of available external data sources"""
    return {"connectors": connector_service.get_available_connectors()}

@router.post("/connect")
def connect_source(request: ConnectorConnectRequest, db: Session = Depends(get_db)):
    """Connect to an external data source"""
    user_id = 1  # Replace with actual user
    result = connector_service.connect_source(
        db, user_id, request.source_type, request.auth_code
    )
    return result

@router.post("/sync")
def sync_source(request: ConnectorSyncRequest, db: Session = Depends(get_db)):
    """Sync data from connected source"""
    user_id = 1  # Replace with actual user
    result = connector_service.sync_notes(db, user_id, request.source_id)
    return result

@router.get("/notes")
def get_imported_notes(db: Session = Depends(get_db)):
    """Get all imported notes"""
    user_id = 1  # Replace with actual user
    return {"notes": connector_service.get_imported_notes(db, user_id)}